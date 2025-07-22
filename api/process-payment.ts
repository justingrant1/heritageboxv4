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

        logEvent('square_payment_initiated', {
            amount,
            locationId: SQUARE_LOCATION_ID,
            environment: process.env.NODE_ENV
        });

        const response = await fetch(`${SQUARE_API_URL}/v2/payments`, {
            method: 'POST',
            headers: {
                'Square-Version': '2024-02-15',
                'Authorization': `Bearer ${squareAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source_id: token,
                amount_money: {
                    amount: Math.round(amount * 100), // Convert to cents
                    currency: 'USD'
                },
                location_id: SQUARE_LOCATION_ID,
                idempotency_key: crypto.randomUUID()
            })
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

        logEvent('payment_successful', {
            paymentId: result.payment?.id,
            amount: result.payment?.amount_money?.amount,
            status: result.payment?.status
        });

        // Here you would typically:
        // 1. Save the order details to your database
        // 2. Send confirmation emails
        // 3. Update inventory
        // 4. etc.

        return new Response(JSON.stringify({
            success: true,
            payment: result.payment
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
