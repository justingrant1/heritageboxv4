import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'human';
  timestamp: Date;
}

// Simplified session storage - just keep it in memory for now
const sessions = new Map<string, any>();

async function createChatSession(sessionId: string, initialMessage: Message) {
  console.log('=== CREATING CHAT SESSION ===');
  console.log('Session ID:', sessionId);
  console.log('Initial message:', initialMessage);
  
  // Just store in memory for now - no complex Airtable calls
  const session = {
    id: sessionId,
    messages: [initialMessage],
    status: 'Active',
    created: new Date()
  };
  
  sessions.set(sessionId, session);
  console.log('Session created successfully');
  return session;
}

async function updateChatSession(
  sessionId: string, 
  message: Message, 
  slackThreadId?: string
) {
  console.log('=== UPDATING CHAT SESSION ===');
  console.log('Session ID:', sessionId);
  console.log('New message:', message);
  console.log('Slack thread ID:', slackThreadId);
  
  const session = sessions.get(sessionId);
  if (!session) {
    console.log('Session not found, creating new one');
    return createChatSession(sessionId, message);
  }
  
  session.messages.push(message);
  if (slackThreadId) {
    session.slackThreadId = slackThreadId;
  }
  
  sessions.set(sessionId, session);
  console.log('Session updated successfully');
  return session;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, sessionId, message, initialMessage, slackThreadId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    switch (action) {
      case 'create':
        if (!initialMessage) {
          return res.status(400).json({ error: 'Initial message is required' });
        }
        await createChatSession(sessionId, initialMessage);
        res.json({ success: true, sessionId });
        break;

      case 'addMessage':
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }
        await updateChatSession(sessionId, message, slackThreadId);
        res.json({ success: true });
        break;

      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Chat session error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
