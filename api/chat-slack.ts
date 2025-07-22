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

async function sendSlackMessage(message: SlackMessage): Promise<any> {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: message.channel,
      text: message.text,
      thread_ts: message.thread_ts,
      username: message.username || 'Heritagebox Chat',
      icon_emoji: message.icon_emoji || ':speech_balloon:'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function createSlackThread(customerMessage: string, sessionId: string): Promise<string> {
  const initialMessage = `🆕 **New Chat Session Started**
**Session ID:** ${sessionId}
**Customer Message:** "${customerMessage}"
**Status:** Customer requesting human assistance

_Reply in this thread to chat with the customer. Messages will be sent back to the chat widget in real-time._`;

  const result = await sendSlackMessage({
    text: initialMessage,
    channel: VIP_SALES_CHANNEL,
    username: 'Heritagebox Chat Bot',
    icon_emoji: ':robot_face:'
  });

  if (!result.ok) {
    throw new Error(`Failed to create Slack thread: ${result.error}`);
  }

  return result.ts; // Thread timestamp
}

async function sendMessageToSlack(message: string, threadId: string, fromCustomer: boolean = true): Promise<void> {
  const username = fromCustomer ? 'Customer' : 'Heritagebox Agent';
  const icon = fromCustomer ? ':bust_in_silhouette:' : ':technologist:';
  
  const slackMessage = fromCustomer 
    ? `**Customer:** ${message}`
    : `**Agent:** ${message}`;

  const result = await sendSlackMessage({
    text: slackMessage,
    channel: VIP_SALES_CHANNEL,
    thread_ts: threadId,
    username,
    icon_emoji: icon
  });

  if (!result.ok) {
    throw new Error(`Failed to send message to Slack: ${result.error}`);
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
