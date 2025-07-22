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

// Airtable MCP operations via server-side MCP calls
// This would need to be implemented with actual MCP client calls
// For now, we'll implement direct Airtable API calls

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;

async function makeAirtableCall(method: string, endpoint: string, data?: any) {
    if (!AIRTABLE_API_KEY) {
        throw new Error('Airtable API key not configured');
    }

    const response = await fetch(`${AIRTABLE_API_URL}${endpoint}`, {
        method,
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
}

export default async function handler(request: Request) {
    logEvent('airtable_request_received', {
        method: request.method,
        url: request.url
    });

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({success: false, error: 'Method not allowed'}), {
            status: 405,
            headers: {'Content-Type': 'application/json'}
        });
    }

    try {
        const body = await request.json();
        const { operation, baseId, tableId, ...params } = body;

        logEvent('airtable_operation', {
            operation,
            baseId,
            tableId,
            hasParams: Object.keys(params).length > 0
        });

        let result;

        switch (operation) {
            case 'list_records':
                result = await makeAirtableCall('GET', `/${baseId}/${tableId}?${new URLSearchParams(params.query || {})}`);
                break;

            case 'search_records':
                const searchParams = new URLSearchParams();
                if (params.filterByFormula) {
                    searchParams.append('filterByFormula', params.filterByFormula);
                }
                if (params.maxRecords) {
                    searchParams.append('maxRecords', params.maxRecords.toString());
                }
                result = await makeAirtableCall('GET', `/${baseId}/${tableId}?${searchParams}`);
                break;

            case 'create_record':
                result = await makeAirtableCall('POST', `/${baseId}/${tableId}`, {
                    records: [{ fields: params.fields }]
                });
                // Return single record for consistency
                result = result.records[0];
                break;

            case 'update_records':
                result = await makeAirtableCall('PATCH', `/${baseId}/${tableId}`, {
                    records: params.records
                });
                break;

            case 'get_record':
                result = await makeAirtableCall('GET', `/${baseId}/${tableId}/${params.recordId}`);
                break;

            default:
                return new Response(JSON.stringify({success: false, error: 'Unknown operation'}), {
                    status: 400,
                    headers: {'Content-Type': 'application/json'}
                });
        }

        logEvent('airtable_success', {
            operation,
            hasResult: !!result
        });

        return new Response(JSON.stringify({success: true, data: result}), {
            status: 200,
            headers: {'Content-Type': 'application/json'}
        });

    } catch (error) {
        logEvent('airtable_error', {
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
