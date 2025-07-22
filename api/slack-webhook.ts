import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { storeMessageForPolling } from './messages-poll';

const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;

interface SlackEvent {
  type: string;
  channel?: string;
  user?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
  bot_id?: string;
  subtype?: string;
}

interface SlackEventPayload {
  token?: string;
  team_id?: string;
  api_app_id?: string;
  event?: SlackEvent;
  type: string;
  event_id?: string;
  event_time?: number;
  challenge?: string;
}

// Verify that the request comes from Slack
function verifySlackSignature(body: string, signature: string, timestamp: string): boolean {
  if (!SLACK_SIGNING_SECRET) {
    console.error('SLACK_SIGNING_SECRET not configured');
    return false;
  }

  const time = parseInt(timestamp);
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Request is older than 5 minutes, reject it
  if (Math.abs(currentTime - time) > 300) {
    return false;
  }

  const baseString = `v0:${timestamp}:${body}`;
  const mySignature = `v0=${createHmac('sha256', SLACK_SIGNING_SECRET).update(baseString).digest('hex')}`;
  
  return signature === mySignature;
}

// Process incoming Slack message and send to chat widget
async function processSlackMessage(event: SlackEvent): Promise<void> {
  // Ignore bot messages and messages without text
  if (event.bot_id || event.subtype || !event.text || !event.user) {
    return;
  }

  // Get the #vip-sales channel ID from environment
  const vipSalesChannelId = process.env.SLACK_VIP_SALES_CHANNEL;
  
  // Only process messages from #vip-sales channel
  if (!vipSalesChannelId || event.channel !== vipSalesChannelId) {
    return;
  }

  // If this is a threaded message, it's part of a chat conversation
  if (event.thread_ts) {
    try {
      // Send message to the chat widget frontend
      // This would typically use WebSockets or another real-time method
      // For now, we'll store it in a way the frontend can poll for it
      
      const messageData = {
        type: 'slack_message',
        content: event.text,
        timestamp: event.ts,
        threadId: event.thread_ts,
        userId: event.user,
        isFromAgent: true
      };

      // Here you would typically send this to your frontend via WebSocket
      // or store it in a database/cache for the frontend to poll
      console.log('New Slack message to forward to chat widget:', messageData);
      
      // Store message for the chat widget to poll
      storeMessageForPolling({
        threadId: event.thread_ts,
        content: event.text,
        timestamp: event.ts || Date.now().toString(),
        isFromAgent: true,
        userId: event.user
      });
      
    } catch (error) {
      console.error('Error processing Slack message:', error);
    }
  }
}

// Store message for the chat widget to retrieve
async function storeMessageForWidget(messageData: any): Promise<void> {
  // In a real implementation, you'd store this in Redis, database, or send via WebSocket
  // For this example, we'll use a simple approach that could be extended
  console.log('Storing message for widget:', messageData);
  
  // You could implement this with:
  // - Redis pub/sub
  // - Database with polling
  // - WebSocket connections
  // - Server-Sent Events (SSE)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Slack-Signature, X-Slack-Request-Timestamp');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get Slack signature and timestamp from headers
    const signature = req.headers['x-slack-signature'] as string;
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    const rawBody = JSON.stringify(req.body);

    // Verify the request is from Slack
    if (!signature || !timestamp || !verifySlackSignature(rawBody, signature, timestamp)) {
      console.error('Invalid Slack signature');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload: SlackEventPayload = req.body;

    // Handle URL verification (required when setting up the webhook)
    if (payload.type === 'url_verification') {
      return res.status(200).json({ challenge: payload.challenge });
    }

    // Handle events
    if (payload.type === 'event_callback' && payload.event) {
      await processSlackMessage(payload.event);
      return res.status(200).json({ ok: true });
    }

    // Handle other event types if needed
    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Slack webhook error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
