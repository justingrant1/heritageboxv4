export const config = {
    runtime: 'edge',
};

// Square Catalog Product Mapping
const SQUARE_CATALOG_MAPPING = {
    // Main Packages
    packages: {
        starter: {
            itemId: 'CWZUFHRUS6WG223QCKMLGDMV',
            variationId: 'GNQP4YZH57MGVR265N4QA7QH',
            name: 'Starter Package',
            price: 69.00,
            digitalFiles: '3 tapes OR 75 photos',
            processingTime: '4-6 weeks'
        },
        popular: {
            itemId: 'SRFFZ5C7PZ2FP2MMQC4SF5SO',
            variationId: 'MXDI5KGKHQE2G7MVWPGJWZIS',
            name: 'Popular Package',
            price: 179.00,
            digitalFiles: '10 tapes OR 250 photos',
            processingTime: '4-6 weeks'
        },
        dustyRose: {
            itemId: 'SR4WG6NXKQRBPZZR5SAIQ42V',
            variationId: 'GKIADSF5IJQEAAKCIL2WXZEK',
            name: 'Dusty Rose Package',
            price: 349.00,
            digitalFiles: '20 tapes OR 500 photos',
            processingTime: '4-6 weeks'
        },
        eternal: {
            itemId: '6QQ3TRFXNERSKJO7RDJPJIRZ',
            variationId: 'X2N4DL3YZBKJYAICCVYMSJ6Y',
            name: 'Eternal Package',
            price: 599.00,
            digitalFiles: '40 tapes OR 1000 photos',
            processingTime: '4-6 weeks'
        }
    },
    addons: {
        customUsb: {
            itemId: 'NCR5WYLYAJOCWVG4S3IMNZPF',
            variationId: 'SMW4WXZUAE6E5L3FTS76NC7Y',
            name: 'Custom USB Drive',
            price: 24.95
        },
        expeditedProcessing: {
            itemId: '56ZXSWLL3X3TMEQBYM6KJWXF',
            variationId: '37LXAW3CQ7ONF7AGNCYDWRRT',
            name: 'Expedited Processing',
            price: 29.99,
            processingTime: '2-3 weeks'
        },
        rushProcessing: {
            itemId: '3P62CBU2OECIDL4PKTOWPFWM',
            variationId: 'HSMOF4CINCKHVWUPCEN5ZBOU',
            name: 'Rush Processing',
            price: 64.99,
            processingTime: '10 business days'
        }
    }
};

// Coupon code to Square discount ID mapping
const COUPON_CODE_MAPPING = {
    '99DOFF': '7RQTL7HC3MC6OPOJXO4QOWHY',  // $99 off
    '99SOFF': 'YNCJK4BPNMNUUJJT5S2SWYGP',  // $99 off shipping
    '15OFF': 'O4LYCD2U5MDIG5B6VMNUH6JB',   // 15% off
    'SAVE15': 'QL2BRYKDUXOOASYR2S6ORYTE'   // 15% off
};

// Helper function to map frontend package names to Square catalog
function mapPackageToSquare(packageName: string) {
    const packageMap = {
        'Starter Package': 'starter',
        'Popular Package': 'popular', 
        'Dusty Rose Package': 'dustyRose',
        'Eternal Package': 'eternal'
    };
    
    return packageMap[packageName] ? SQUARE_CATALOG_MAPPING.packages[packageMap[packageName]] : null;
}

// Helper function to create line items from order details
function createSquareLineItems(orderDetails: any): any[] {
    const lineItems: any[] = [];

    // Add main package
    if (orderDetails.packageName) {
        const packageDetails = mapPackageToSquare(orderDetails.packageName);
        if (packageDetails) {
            lineItems.push({
                catalog_object_id: packageDetails.variationId,
                quantity: '1',
                note: `Digital files: ${packageDetails.digitalFiles}, Processing: ${packageDetails.processingTime}`
            });
        }
    }

    // Add selected addons
    if (orderDetails.addons) {
        orderDetails.addons.forEach((addon: any) => {
            let addonDetails: any = null;
            
            // Map addon names to catalog items
            switch (addon.name) {
                case 'Custom USB Drive':
                    addonDetails = SQUARE_CATALOG_MAPPING.addons.customUsb;
                    break;
                case 'Expedited Processing':
                    addonDetails = SQUARE_CATALOG_MAPPING.addons.expeditedProcessing;
                    break;
                case 'Rush Processing':
                    addonDetails = SQUARE_CATALOG_MAPPING.addons.rushProcessing;
                    break;
            }

            if (addonDetails) {
                lineItems.push({
                    catalog_object_id: addonDetails.variationId,
                    quantity: String(addon.quantity || 1),
                    note: addon.name || ''
                });
            }
        });
    }

    return lineItems;
}

// Helper function to calculate processing time based on addons
function calculateProcessingTime(orderDetails: any): string {
    if (orderDetails.addons) {
        const hasRush = orderDetails.addons.some((addon: any) => addon.name === 'Rush Processing');
        const hasExpedited = orderDetails.addons.some((addon: any) => addon.name === 'Expedited Processing');
        
        if (hasRush) return '10 business days';
        if (hasExpedited) return '2-3 weeks';
    }
    
    return '4-6 weeks';
}

// Helper function to format customer data for Square
function formatCustomerData(customerDetails: any) {
    return {
        given_name: customerDetails.firstName || '',
        family_name: customerDetails.lastName || '',
        email_address: customerDetails.email || '',
        phone_number: customerDetails.phone || '',
        address: customerDetails.address ? {
            address_line_1: customerDetails.address.street || '',
            address_line_2: customerDetails.address.street2 || '',
            locality: customerDetails.address.city || '',
            administrative_district_level_1: customerDetails.address.state || '',
            postal_code: customerDetails.address.zip || '',
            country: customerDetails.address.country || 'US'
        } : undefined
    };
}

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

            // Create basic line items without catalog references for now
            const lineItems: any[] = [];
            
            // Add main package as basic line item
            if (orderDetails.packageName) {
                const packageDetails = mapPackageToSquare(orderDetails.packageName);
                const packagePrice = packageDetails ? packageDetails.price : (amount * 0.8); // Estimate main package as 80% of total
                
                lineItems.push({
                    name: orderDetails.packageName,
                    quantity: '1',
                    base_price_money: {
                        amount: Math.round(packagePrice * 100),
                        currency: 'USD'
                    },
                    note: packageDetails ? `Digital files: ${packageDetails.digitalFiles}, Processing: ${packageDetails.processingTime}` : 'Memory digitization service'
                });
            }

            // Add addons as basic line items
            if (orderDetails.addons && orderDetails.addons.length > 0) {
                orderDetails.addons.forEach((addon: any) => {
                    let addonPrice = 0;
                    switch (addon.name) {
                        case 'Custom USB Drive':
                            addonPrice = 24.95;
                            break;
                        case 'Expedited Processing':
                            addonPrice = 29.99;
                            break;
                        case 'Rush Processing':
                            addonPrice = 64.99;
                            break;
                        default:
                            addonPrice = addon.price || 0;
                    }
                    
                    lineItems.push({
                        name: addon.name,
                        quantity: String(addon.quantity || 1),
                        base_price_money: {
                            amount: Math.round(addonPrice * 100),
                            currency: 'USD'
                        },
                        note: `Add-on service: ${addon.name}`
                    });
                });
            }
            
            // Fallback if no line items were created
            if (lineItems.length === 0) {
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

            // Add discount if coupon code is provided (using basic discount instead of catalog)
            if (orderDetails.couponCode) {
                const couponCode = orderDetails.couponCode.toUpperCase();
                let discount: any = null;
                
                switch (couponCode) {
                    case '99DOFF':
                    case '99SOFF':
                        discount = {
                            name: `Coupon: ${couponCode}`,
                            type: 'FIXED_AMOUNT',
                            amount_money: {
                                amount: 9900, // $99 in cents
                                currency: 'USD'
                            },
                            scope: 'ORDER'
                        };
                        break;
                    case '15OFF':
                    case 'SAVE15':
                        discount = {
                            name: `Coupon: ${couponCode}`,
                            type: 'FIXED_PERCENTAGE',
                            percentage: '15.0',
                            scope: 'ORDER'
                        };
                        break;
                }
                
                if (discount) {
                    orderPayload.order.discounts = [discount];
                    logEvent('applying_basic_discount', {
                        couponCode,
                        discountType: discount.type
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
