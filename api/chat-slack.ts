import type { VercelRequest, VercelResponse } from '@vercel/node';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const VIP_SALES_CHANNEL = process.env.SLACK_VIP_SALES_CHANNEL || 'C02CPNGTL5Q';

interface SlackMessage {
  text: string;
  channel: string;
  thread_ts?: string;
  username?: string;
  icon_emoji?: string;
}

// Ultra-simple Slack API test - no complexity, no formatting
async function testSlackConnection(message: string): Promise<any> {
  console.log('=== TESTING SLACK API ===');
  console.log('Token exists:', !!SLACK_BOT_TOKEN);
  console.log('Channel:', VIP_SALES_CHANNEL);
  console.log('Message:', message);

  const payload = {
    channel: VIP_SALES_CHANNEL,
    text: message
  };
  
  console.log('Payload:', JSON.stringify(payload));

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  const result = await response.json();
  console.log('=== FULL SLACK RESPONSE ===');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

async function createSlackThread(customerMessage: string, sessionId: string): Promise<string> {
  // Super simple message - no formatting at all
  const simpleMessage = `New customer chat - Session ${sessionId}: ${customerMessage}`;
  
  const result = await testSlackConnection(simpleMessage);
  
  if (!result.ok) {
    console.error('Slack API failed:', result);
    throw new Error(`Slack error: ${result.error || 'Unknown error'}`);
  }

  return result.ts || 'no-thread-id';
}

async function sendMessageToSlack(message: string, threadId: string, fromCustomer: boolean = true): Promise<void> {
  // Ultra simple message with no formatting
  const simpleMessage = fromCustomer ? `Customer: ${message}` : `Agent: ${message}`;
  
  const payload = {
    channel: VIP_SALES_CHANNEL,
    text: simpleMessage,
    thread_ts: threadId
  };

  console.log('Sending to thread:', JSON.stringify(payload));

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  console.log('Thread message result:', result);

  if (!result.ok) {
    throw new Error(`Failed to send thread message: ${result.error}`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, sessionId, message, threadId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    switch (action) {
      case 'createThread':
        if (!message) {
          return res.status(400).json({ error: 'Message is required to create thread' });
        }
        const newThreadId = await createSlackThread(message, sessionId);
        res.json({ success: true, threadId: newThreadId });
        break;

      case 'sendMessage':
        if (!message || !threadId) {
          return res.status(400).json({ error: 'Message and thread ID are required' });
        }
        await sendMessageToSlack(message, threadId, true); // From customer
        res.json({ success: true });
        break;

      case 'sendAgentMessage':
        if (!message || !threadId) {
          return res.status(400).json({ error: 'Message and thread ID are required' });
        }
        await sendMessageToSlack(message, threadId, false); // From agent
        res.json({ success: true });
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Slack integration error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
