import { 
    SQUARE_CATALOG_ITEMS, 
    buildSquareLineItems, 
    buildSquareCustomerData, 
    mapPackageToSquareCatalog, 
    mapAddOnsToSquareCatalog,
    type OrderDetails 
} from '../src/utils/squareIntegration.js';

export const config = {
    runtime: 'edge',
};

// Helper function for structured logging
function logEvent(event: string, data: any) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        event,
        ...data
    }));
}

// Square MCP integration functions
async function findOrCreateCustomer(customerData: any, squareConfig: any) {
    try {
        // First try to find existing customer by email
        const searchResponse = await fetch(`${squareConfig.apiUrl}/v2/customers/search`, {
            method: 'POST',
            headers: {
                'Square-Version': '2024-02-15',
                'Authorization': `Bearer ${squareConfig.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filter: {
                    email_address: {
                        exact: customerData.email_address
                    }
                }
            })
        });

        const searchResult = await searchResponse.json();
        
        if (searchResult.customers && searchResult.customers.length > 0) {
            logEvent('customer_found', { customerId: searchResult.customers[0].id });
            return searchResult.customers[0];
        }

        // Customer not found, create new one
        const createResponse = await fetch(`${squareConfig.apiUrl}/v2/customers`, {
            method: 'POST',
            headers: {
                'Square-Version': '2024-02-15',
                'Authorization': `Bearer ${squareConfig.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                given_name: customerData.given_name,
                family_name: customerData.family_name,
                email_address: customerData.email_address,
                phone_number: customerData.phone_number,
                address: customerData.address
            })
        });

        const createResult = await createResponse.json();
        
        if (!createResponse.ok) {
            throw new Error(createResult.errors?.[0]?.detail || 'Failed to create customer');
        }

        logEvent('customer_created', { customerId: createResult.customer.id });
        return createResult.customer;
    } catch (error) {
        logEvent('customer_error', { error: error.message });
        throw error;
    }
}

async function createSquareOrder(orderData: any, squareConfig: any) {
    try {
        const response = await fetch(`${squareConfig.apiUrl}/v2/orders`, {
            method: 'POST',
            headers: {
                'Square-Version': '2024-02-15',
                'Authorization': `Bearer ${squareConfig.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order: {
                    location_id: squareConfig.locationId,
                    line_items: orderData.lineItems,
                    fulfillments: [
                        {
                            type: 'SHIPMENT',
                            state: 'PROPOSED',
                            shipment_details: {
                                recipient: {
                                    display_name: `${orderData.customer.given_name} ${orderData.customer.family_name}`,
                                    email_address: orderData.customer.email_address,
                                    phone_number: orderData.customer.phone_number,
                                    address: orderData.customer.address
                                }
                            }
                        }
                    ],
                    metadata: {
                        'package_type': orderData.packageType,
                        'add_ons': orderData.addOns.join(','),
                        'customer_id': orderData.customer.id
                    }
                },
                idempotency_key: crypto.randomUUID()
            })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.errors?.[0]?.detail || 'Failed to create order');
        }

        logEvent('order_created', { orderId: result.order.id });
        return result.order;
    } catch (error) {
        logEvent('order_error', { error: error.message });
        throw error;
    }
}

export default async function handler(request: Request) {
    logEvent('request_received', {
        method: request.method,
        url: request.url
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
            hasOrderDetails: !!body.orderDetails
        });

        const {token, amount, orderDetails} = body;

        if (!token || !amount || !orderDetails) {
            logEvent('validation_failed', {
                missingToken: !token,
                missingAmount: !amount,
                missingOrderDetails: !orderDetails
            });
            return new Response(JSON.stringify({success: false, error: 'Missing required fields'}), {
                status: 400,
                headers: {'Content-Type': 'application/json'}
            });
        }

        const squareConfig = {
            accessToken: process.env.SQUARE_ACCESS_TOKEN,
            locationId: process.env.SQUARE_LOCATION_ID,
            apiUrl: process.env.SQUARE_API_URL
        };

        logEvent('environment_check', {
            hasAccessToken: !!squareConfig.accessToken,
            hasLocationId: !!squareConfig.locationId,
            hasApiUrl: !!squareConfig.apiUrl
        });

        if (!squareConfig.accessToken || !squareConfig.locationId || !squareConfig.apiUrl) {
            logEvent('configuration_error', {error: 'Square configuration incomplete'});
            return new Response(JSON.stringify({success: false, error: 'Payment service not configured'}), {
                status: 500,
                headers: {'Content-Type': 'application/json'}
            });
        }

        // Build Square-compatible order details
        const packageType = mapPackageToSquareCatalog(orderDetails.packageType || 'starter');
        const addOns = mapAddOnsToSquareCatalog(orderDetails.addOns || []);
        
        const squareOrderDetails: OrderDetails = {
            packageType,
            addOns,
            customerInfo: {
                firstName: orderDetails.customerInfo?.firstName || orderDetails.firstName,
                lastName: orderDetails.customerInfo?.lastName || orderDetails.lastName,
                email: orderDetails.customerInfo?.email || orderDetails.email,
                phone: orderDetails.customerInfo?.phone || orderDetails.phone,
                address: orderDetails.customerInfo?.address
            },
            discountCode: orderDetails.discountCode,
            discountAmount: orderDetails.discountAmount,
            totalAmount: amount
        };

        // Step 1: Find or create customer
        const customerData = buildSquareCustomerData(squareOrderDetails.customerInfo);
        const customer = await findOrCreateCustomer(customerData, squareConfig);

        // Step 2: Build line items from catalog
        const lineItems = buildSquareLineItems(squareOrderDetails);

        // Step 3: Create order with proper catalog items
        const order = await createSquareOrder({
            customer,
            lineItems,
            packageType: packageType,
            addOns: addOns
        }, squareConfig);

        // Step 4: Create payment linked to customer and order
        logEvent('creating_payment', {
            customerId: customer.id,
            orderId: order.id,
            amount
        });

        const paymentResponse = await fetch(`${squareConfig.apiUrl}/v2/payments`, {
            method: 'POST',
            headers: {
                'Square-Version': '2024-02-15',
                'Authorization': `Bearer ${squareConfig.accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_id: token,
                amount_money: {
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: 'USD'
                },
                location_id: squareConfig.locationId,
                order_id: order.id,
                buyer_email_address: customer.email_address,
                note: `HeritageBox Order - ${SQUARE_CATALOG_ITEMS[packageType].name}`,
                idempotency_key: crypto.randomUUID()
            })
        });

        const paymentResult = await paymentResponse.json();
        
        if (!paymentResponse.ok) {
            logEvent('payment_failed', {
                status: paymentResponse.status,
                errors: paymentResult.errors
            });
            
            const errorMessage = paymentResult.errors?.[0]?.detail || paymentResult.errors?.[0]?.code || 'Payment failed';
            throw new Error(errorMessage);
        }

        logEvent('payment_successful', {
            paymentId: paymentResult.payment?.id,
            customerId: customer.id,
            orderId: order.id,
            amount: paymentResult.payment?.amount_money?.amount
        });

        return new Response(JSON.stringify({
            success: true,
            payment: paymentResult.payment,
            customer: customer,
            order: order
        }), {
            status: 200,
            headers: {'Content-Type': 'application/json'}
        });
        
    } catch (error) {
        logEvent('payment_error', {
            error: error.message,
            stack: error.stack
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
