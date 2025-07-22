import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

const AIRTABLE_API_KEY = process.env.VITE_AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_CHAT_BASE_ID;
const AIRTABLE_TRANSCRIPTS_TABLE = process.env.AIRTABLE_CHAT_TRANSCRIPTS_TABLE;

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'human';
  timestamp: Date;
}

interface ChatTranscriptRecord {
  SessionID: string;
  Transcript: string;
  Status: string;
  CustomerEmail?: string;
  SlackThreadID?: string;
}

async function createChatSession(sessionId: string, initialMessage: Message) {
  const transcript = formatTranscriptEntry(initialMessage);
  
  const record: ChatTranscriptRecord = {
    SessionID: sessionId,
    Transcript: transcript,
    Status: 'Active'
  };

  const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TRANSCRIPTS_TABLE}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: record
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to create chat session: ${response.statusText}`);
  }

  return response.json();
}

async function updateChatSession(
  sessionId: string, 
  message: Message, 
  slackThreadId?: string
) {
  // First, get the current record
  const searchResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TRANSCRIPTS_TABLE}?filterByFormula={SessionID}="${sessionId}"`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      }
    }
  );

  if (!searchResponse.ok) {
    throw new Error('Failed to find chat session');
  }

  const searchData = await searchResponse.json();
  if (searchData.records.length === 0) {
    throw new Error('Chat session not found');
  }

  const record = searchData.records[0];
  const existingTranscript = record.fields.Transcript || '';
  const newTranscriptEntry = formatTranscriptEntry(message);
  const updatedTranscript = existingTranscript + '\n' + newTranscriptEntry;

  const updateFields: any = {
    Transcript: updatedTranscript
  };

  if (slackThreadId) {
    updateFields.SlackThreadID = slackThreadId;
  }

  const updateResponse = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TRANSCRIPTS_TABLE}/${record.id}`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: updateFields
      })
    }
  );

  if (!updateResponse.ok) {
    throw new Error(`Failed to update chat session: ${updateResponse.statusText}`);
  }

  return updateResponse.json();
}

function formatTranscriptEntry(message: Message): string {
  const timestamp = new Date(message.timestamp).toISOString();
  const senderLabel = message.sender === 'user' ? 'Customer' : 
                     message.sender === 'bot' ? 'AI Assistant' : 'Human Agent';
  
  return `[${timestamp}] ${senderLabel}: ${message.content}`;
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
    res.status(500).json({ error: 'Internal server error' });
  }
}
