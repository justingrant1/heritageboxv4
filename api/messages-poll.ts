import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage for demo - in production use Redis, database, or WebSocket
interface StoredMessage {
  id: string;
  threadId: string;
  content: string;
  timestamp: string;
  isFromAgent: boolean;
  userId?: string;
  sessionId?: string;
}

// Simple in-memory store - this would be Redis or database in production
let messageStore: Map<string, StoredMessage[]> = new Map();
let messageIdCounter = 0;

// Store message for polling
export function storeMessageForPolling(messageData: {
  threadId: string;
  content: string;
  timestamp: string;
  isFromAgent: boolean;
  userId?: string;
  sessionId?: string;
}): void {
  const messageId = `msg_${++messageIdCounter}_${Date.now()}`;
  
  const message: StoredMessage = {
    id: messageId,
    ...messageData
  };

  const threadMessages = messageStore.get(messageData.threadId) || [];
  threadMessages.push(message);
  messageStore.set(messageData.threadId, threadMessages);
  
  console.log(`Stored message for thread ${messageData.threadId}:`, message);
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

  try {
    if (req.method === 'GET') {
      // Poll for new messages
      const { threadId, lastMessageId } = req.query;
      
      if (!threadId || typeof threadId !== 'string') {
        return res.status(400).json({ error: 'threadId is required' });
      }

      const threadMessages = messageStore.get(threadId) || [];
      
      // If lastMessageId is provided, return only newer messages
      let newMessages = threadMessages;
      if (lastMessageId && typeof lastMessageId === 'string') {
        const lastIndex = threadMessages.findIndex(msg => msg.id === lastMessageId);
        if (lastIndex !== -1) {
          newMessages = threadMessages.slice(lastIndex + 1);
        }
      }

      res.json({ 
        success: true, 
        messages: newMessages,
        hasMore: newMessages.length > 0
      });

    } else if (req.method === 'POST') {
      // Store a message (for the chat widget to send messages to agents)
      const { threadId, content, sessionId, isFromAgent = false } = req.body;
      
      if (!threadId || !content) {
        return res.status(400).json({ error: 'threadId and content are required' });
      }

      storeMessageForPolling({
        threadId,
        content,
        timestamp: Date.now().toString(),
        isFromAgent,
        sessionId
      });

      res.json({ success: true });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Messages poll error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
