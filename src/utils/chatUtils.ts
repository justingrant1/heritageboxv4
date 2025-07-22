export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot' | 'human';
  timestamp: Date;
}

export interface ChatSession {
  sessionId: string;
  isHandoffMode: boolean;
  slackThreadId?: string;
}

export interface ExtendedChatSession extends ChatSession {
  mode: 'ai' | 'human';
  messages: Message[];
  customerEmail?: string;
  status: 'active' | 'ended';
}

// Generate unique session ID
export function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique message ID
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// API endpoints
const API_BASE = '/api';

export async function sendMessageToAI(message: string, conversationHistory: Message[]): Promise<string> {
  const response = await fetch(`${API_BASE}/chat-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      conversationHistory
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get AI response');
  }

  const data = await response.json();
  return data.response;
}

export async function createChatSession(sessionId: string, initialMessage: Message): Promise<void> {
  const response = await fetch(`${API_BASE}/chat-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create',
      sessionId,
      initialMessage
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create chat session');
  }
}

export async function addMessageToSession(
  sessionId: string, 
  message: Message, 
  slackThreadId?: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'addMessage',
      sessionId,
      message,
      slackThreadId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to add message to session');
  }
}

export async function createSlackThread(sessionId: string, message: string): Promise<string> {
  const response = await fetch(`${API_BASE}/chat-slack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'createThread',
      sessionId,
      message
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create Slack thread');
  }

  const data = await response.json();
  return data.threadId;
}

export async function sendMessageToSlack(
  sessionId: string, 
  threadId: string, 
  message: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/chat-slack`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'sendMessage',
      sessionId,
      threadId,
      message
    })
  });

  if (!response.ok) {
    throw new Error('Failed to send message to Slack');
  }
}

// Format timestamp for display
export function formatMessageTime(timestamp: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(timestamp);
}

// Check if message is recent (within last 5 minutes)
export function isRecentMessage(timestamp: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  return diff < 5 * 60 * 1000; // 5 minutes
}
