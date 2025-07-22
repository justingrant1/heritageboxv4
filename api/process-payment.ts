export const config = {
    runtime: 'edge',
};

// Import Square utilities
import { 
    COUPON_CODE_MAPPING, 
    createSquareLineItems, 
    formatCustomerData, 
    calculateProcessingTime 
} from '../src/utils/squareUtils';

// Helper function for structured logging
function logEvent(event: string, data: any) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event,
        ...data
    }));
}

export default async function handler(request: Request) {
    logEvent('request_received', {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries())
    });

    if (request.method !== 'POST') {
        logEvent('method_not_allowed', {method: request.method});
        return new Response(JSON.stringify({success: false, error: 'Method not allowed'}), {
            status: 405,
            headers: {'Content-Type': 'application/json'}
        });
    }

    try {
        const body = await request.json();
        logEvent('request_body_parsed', {
            hasToken: !!body.token,
            amount: body.amount,
            orderDetails: body.orderDetails
        });

        const {token, amount, orderDetails} = body;

        if (!token || !amount) {
            logEvent('validation_failed', {
                missingToken: !token,
                missingAmount: !amount
            });
            return new Response(JSON.stringify({success: false, error: 'Missing required fields'}), {
                status: 400,
                headers: {'Content-Type': 'application/json'}
            });
        }

        const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
        const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
        const SQUARE_API_URL = process.env.SQUARE_API_URL;

        logEvent('environment_check', {
            hasAccessToken: !!squareAccessToken,
            hasLocationId: !!SQUARE_LOCATION_ID,
            hasApiUrl: !!SQUARE_API_URL,
            nodeEnv: process.env.NODE_ENV
        });

        if (!squareAccessToken) {
            logEvent('configuration_error', {error: 'SQUARE_ACCESS_TOKEN not configured'});
            return new Response(JSON.stringify({success: false, error: 'Payment service not configured - missing access token'}), {
                status: 500,
                headers: {'Content-Type': 'application/json'}
            });
        }

        if (!SQUARE_LOCATION_ID) {
            logEvent('configuration_error', {error: 'SQUARE_LOCATION_ID not configured'});
            return new Response(JSON.stringify({success: false, error: 'Payment service not configured - missing location ID'}), {
                status: 500,
                headers: {'Content-Type': 'application/json'}
            });
        }

        if (!SQUARE_API_URL) {
            logEvent('configuration_error', {error: 'SQUARE_API_URL not configured'});
            return new Response(JSON.stringify({success: false, error: 'Payment service not configured - missing API URL'}), {
                status: 500,
                headers: {'Content-Type': 'application/json'}
            });
        }

        // Step 1: Create/Find Customer in Square
        let customerId: string | null = null;
        if (orderDetails?.customerDetails) {
            logEvent('managing_square_customer', {
                hasCustomerDetails: !!orderDetails.customerDetails,
                email: orderDetails.customerDetails.email
            });

            const customerData = formatCustomerData(orderDetails.customerDetails);
            
            // Try to find existing customer by email first
            if (customerData.email_address) {
                try {
                    const customerSearchResponse = await fetch(`${SQUARE_API_URL}/v2/customers/search`, {
                        method: 'POST',
                        headers: {
                            'Square-Version': '2024-02-15',
                            'Authorization': `Bearer ${squareAccessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            filter: {
                                email_address: {
                                    exact: customerData.email_address
                                }
                            },
                            limit: 1
                        })
                    });

                    const searchResult = await customerSearchResponse.json();
                    if (customerSearchResponse.ok && searchResult.customers && searchResult.customers.length > 0) {
                        customerId = searchResult.customers[0].id;
                        logEvent('existing_customer_found', { customerId });
                    }
                } catch (error) {
                    logEvent('customer_search_failed', { error: error.message });
                }
            }

            // Create new customer if not found
            if (!customerId) {
                try {
                    const customerResponse = await fetch(`${SQUARE_API_URL}/v2/customers`, {
                        method: 'POST',
                        headers: {
                            'Square-Version': '2024-02-15',
                            'Authorization': `Bearer ${squareAccessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            ...customerData,
                            idempotency_key: crypto.randomUUID()
                        })
                    });

                    const customerResult = await customerResponse.json();
                    if (customerResponse.ok && customerResult.customer) {
                        customerId = customerResult.customer.id;
                        logEvent('new_customer_created', { customerId });
                    } else {
                        logEvent('customer_creation_failed', { errors: customerResult.errors });
                    }
                } catch (error) {
                    logEvent('customer_creation_error', { error: error.message });
                }
            }
        }

        // Step 2: Create Order in Square with proper catalog items
        let orderId: string | null = null;
        if (orderDetails) {
            logEvent('creating_square_order', {
                packageName: orderDetails.packageName,
                addons: orderDetails.addons,
                couponCode: orderDetails.couponCode,
                customerId
            });

            // Create line items from catalog
            const lineItems = createSquareLineItems(orderDetails);
            
            if (lineItems.length === 0) {
                // Fallback to generic line item
                lineItems.push({
                    name: 'Heritage Box Service',
                    quantity: '1',
                    base_price_money: {
                        amount: Math.round(amount * 100),
                        currency: 'USD'
                    },
                    note: 'Memory digitization service'
                });
            }

            const processingTime = calculateProcessingTime(orderDetails);
            const orderPayload: any = {
                order: {
                    location_id: SQUARE_LOCATION_ID,
                    reference_id: `hb_${Date.now()}`,
                    line_items: lineItems,
                    metadata: {
                        processing_time: processingTime,
                        package_name: orderDetails.packageName || 'Custom Service',
                        customer_notes: orderDetails.customerNotes || '',
                        shipping_address: orderDetails.shippingAddress ? JSON.stringify(orderDetails.shippingAddress) : ''
                    }
                },
                idempotency_key: crypto.randomUUID()
            };

            // Link customer to order
            if (customerId) {
                orderPayload.order.customer_id = customerId;
            }

            // Add discount if coupon code is provided
            if (orderDetails.couponCode) {
                const couponCode = orderDetails.couponCode.toUpperCase();
                const discountId = COUPON_CODE_MAPPING[couponCode];
                
                if (discountId) {
                    orderPayload.order.discounts = [{
                        catalog_object_id: discountId,
                        name: `Coupon: ${couponCode}`,
                        scope: 'ORDER'
                    }];
                    
                    logEvent('applying_square_discount', {
                        couponCode,
                        discountId
                    });
                }
            }

            const orderResponse = await fetch(`${SQUARE_API_URL}/v2/orders`, {
                method: 'POST',
                headers: {
                    'Square-Version': '2024-02-15',
                    'Authorization': `Bearer ${squareAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderPayload)
            });

            const orderResult = await orderResponse.json();
            
            if (!orderResponse.ok) {
                logEvent('square_order_error', {
                    status: orderResponse.status,
                    errors: orderResult.errors,
                    fullErrorResponse: orderResult
                });
                throw new Error(orderResult.errors?.[0]?.detail || 'Failed to create order in Square');
            }

            orderId = orderResult.order?.id;
            logEvent('square_order_created', {
                orderId,
                customerId,
                totalMoney: orderResult.order?.total_money,
                lineItems: orderResult.order?.line_items?.length,
                processingTime
            });
        }

        // Step 3: Process payment
        logEvent('square_payment_initiated', {
            amount,
            orderId,
            customerId,
            locationId: SQUARE_LOCATION_ID,
            environment: process.env.NODE_ENV
        });

        const paymentPayload: any = {
            source_id: token,
            amount_money: {
                amount: Math.round(amount * 100), // Convert to cents
                currency: 'USD'
            },
            location_id: SQUARE_LOCATION_ID,
            idempotency_key: crypto.randomUUID()
        };

        // Link payment to order if order was created
        if (orderId) {
            paymentPayload.order_id = orderId;
        }

        const response = await fetch(`${SQUARE_API_URL}/v2/payments`, {
            method: 'POST',
            headers: {
                'Square-Version': '2024-02-15',
                'Authorization': `Bearer ${squareAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentPayload)
        });

        const result = await response.json();
        logEvent('square_response_received', {
            status: response.status,
            ok: response.ok,
            hasErrors: !!result.errors,
            errorDetails: result.errors,
            fullResponse: result
        });

        if (!response.ok) {
            // Log more detailed error information
            logEvent('square_api_error', {
                status: response.status,
                errors: result.errors,
                fullErrorResponse: result
            });
            
            const errorMessage = result.errors?.[0]?.detail || result.errors?.[0]?.code || 'Payment failed';
            throw new Error(errorMessage);
        }

        const processingTime = orderDetails ? calculateProcessingTime(orderDetails) : '4-6 weeks';
        
        logEvent('payment_successful', {
            paymentId: result.payment?.id,
            orderId: result.payment?.order_id,
            customerId,
            amount: result.payment?.amount_money?.amount,
            status: result.payment?.status,
            processingTime,
            packageName: orderDetails?.packageName,
            hasAddons: !!(orderDetails?.addons?.length),
            appliedDiscount: orderDetails?.couponCode
        });

        // Enhanced response with comprehensive tracking data
        return new Response(JSON.stringify({
            success: true,
            payment: result.payment,
            orderId: orderId,
            customerId: customerId,
            trackingInfo: {
                processingTime,
                packageName: orderDetails?.packageName || 'Custom Service',
                addons: orderDetails?.addons || [],
                couponApplied: orderDetails?.couponCode || null,
                estimatedCompletion: orderDetails ? 
                    new Date(Date.now() + (processingTime === '10 business days' ? 14 * 24 * 60 * 60 * 1000 : 
                                          processingTime === '2-3 weeks' ? 21 * 24 * 60 * 60 * 1000 : 
                                          42 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : null
            },
            squareData: {
                orderId,
                customerId,
                paymentId: result.payment?.id,
                locationId: SQUARE_LOCATION_ID,
                receiptUrl: result.payment?.receipt_url
            }
        }), {
            status: 200,
            headers: {'Content-Type': 'application/json'}
        });
    } catch (error) {
        logEvent('payment_error', {
            error: error.message,
            stack: error.stack,
            name: error.name
        });

        return new Response(JSON.stringify({
            success: false,
            error: error.message || 'Internal server error'
        }), {
            status: 500,
            headers: {'Content-Type': 'application/json'}
        });
    }
}
