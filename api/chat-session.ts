import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';

const AIRTABLE_BASE_ID = 'appFMHAYZrTskpmdX';
const AIRTABLE_TRANSCRIPTS_TABLE = 'tbl6gHHlvSwx4gQpB';

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

// Helper function to call our Airtable operations endpoint
async function callAirtableAPI(operation: string, params: any) {
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:8080'}/api/airtable-operations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operation,
      baseId: AIRTABLE_BASE_ID,
      tableId: AIRTABLE_TRANSCRIPTS_TABLE,
      ...params
    }),
  });

  if (!response.ok) {
    throw new Error(`Airtable operation failed: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Airtable operation failed');
  }

  return result.data;
}

async function createChatSession(sessionId: string, initialMessage: Message) {
  const transcript = formatTranscriptEntry(initialMessage);
  
  const record = await callAirtableAPI('create_record', {
    fields: {
      'SessionID': sessionId,
      'Transcript': transcript,
      'Status': 'Active'
    }
  });

  return record;
}

async function updateChatSession(
  sessionId: string, 
  message: Message, 
  slackThreadId?: string
) {
  // First, search for the existing record
  const searchResult = await callAirtableAPI('search_records', {
    filterByFormula: `{SessionID} = "${sessionId}"`
  });

  if (!searchResult.records || searchResult.records.length === 0) {
    throw new Error('Chat session not found');
  }

  const record = searchResult.records[0];
  const existingTranscript = record.fields.Transcript || '';
  const newTranscriptEntry = formatTranscriptEntry(message);
  const updatedTranscript = existingTranscript + '\n' + newTranscriptEntry;

  const updateFields: any = {
    'Transcript': updatedTranscript
  };

  if (slackThreadId) {
    updateFields['SlackThreadID'] = slackThreadId;
  }

  const updateResult = await callAirtableAPI('update_records', {
    records: [{
      id: record.id,
      fields: updateFields
    }]
  });

  return updateResult;
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
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
