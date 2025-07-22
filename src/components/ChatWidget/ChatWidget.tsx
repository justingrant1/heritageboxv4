import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatWindow } from './ChatWindow';
import './ChatWidget.css';
import { 
  Message, 
  ChatSession,
  ExtendedChatSession,
  generateSessionId, 
  generateMessageId,
  sendMessageToAI,
  createChatSession,
  addMessageToSession,
  createSlackThread,
  sendMessageToSlack
} from '../../utils/chatUtils';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ExtendedChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  // Initialize chat session
  useEffect(() => {
    if (isOpen && !session) {
      initializeSession();
    }
  }, [isOpen]);

  // Poll for new messages when in human mode
  useEffect(() => {
    if (!session || session.mode !== 'human' || !session.slackThreadId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/messages-poll?threadId=${session.slackThreadId}&lastMessageId=${lastMessageId || ''}`);
        if (!response.ok) return;

        const data = await response.json();
        if (data.success && data.messages.length > 0) {
          const newMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            sender: msg.isFromAgent ? 'human' : 'user',
            timestamp: new Date(parseInt(msg.timestamp))
          }));

          setSession(prev => prev ? {
            ...prev,
            messages: [...prev.messages, ...newMessages]
          } : null);

          // Update last message ID
          const lastMsg = data.messages[data.messages.length - 1];
          setLastMessageId(lastMsg.id);
        }
      } catch (error) {
        console.error('Error polling for messages:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [session, lastMessageId]);

  const initializeSession = async () => {
    const sessionId = generateSessionId();
    const welcomeMessage: Message = {
      id: generateMessageId(),
      content: `Hi! I'm your Heritagebox AI assistant. I can help you with:

📸 Photo digitization pricing
🎬 Video transfer options  
📦 Project status updates
⏱️ Turnaround times

What would you like to know?`,
      sender: 'bot',
      timestamp: new Date()
    };

    const newSession: ExtendedChatSession = {
      sessionId,
      isHandoffMode: false,
      mode: 'ai',
      messages: [welcomeMessage],
      status: 'active'
    };

    setSession(newSession);

    // Create session in Airtable
    try {
      await fetch('/api/chat-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          sessionId,
          initialMessage: welcomeMessage
        })
      });
    } catch (error) {
      console.error('Failed to create chat session:', error);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = async (content: string) => {
    if (!session || isLoading) return;

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content,
      sender: 'user',
      timestamp: new Date()
    };

    const updatedMessages = [...session.messages, userMessage];
    setSession({ ...session, messages: updatedMessages });

    try {
      // Update session in Airtable
      await fetch('/api/chat-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addMessage',
          sessionId: session.sessionId,
          message: userMessage
        })
      });

      // Get AI or human response based on current mode
      const endpoint = session.mode === 'ai' ? '/api/chat-ai' : '/api/chat-slack';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          message: content,
          conversationHistory: updatedMessages
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: uuidv4(),
        content: data.response,
        sender: session.mode === 'ai' ? 'bot' : 'human',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, botMessage];
      
      // Update session with bot response
      setSession({ 
        ...session, 
        messages: finalMessages,
        slackThreadId: data.slackThreadId || session.slackThreadId
      });

      // Update Airtable with bot response
      await fetch('/api/chat-session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addMessage',
          sessionId: session.sessionId,
          message: botMessage,
          slackThreadId: data.slackThreadId
        })
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: uuidv4(),
        content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        sender: 'bot',
        timestamp: new Date()
      };

      setSession({ 
        ...session, 
        messages: [...updatedMessages, errorMessage]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToHuman = async () => {
    if (!session) return;

    setSession({ ...session, mode: 'human' });

    // Send transition message
    const transitionMessage: Message = {
      id: uuidv4(),
      content: "I'm connecting you with a human agent. Please hold on a moment...",
      sender: 'bot',
      timestamp: new Date()
    };

    const updatedMessages = [...session.messages, transitionMessage];
    setSession({ ...session, messages: updatedMessages, mode: 'human' });

    try {
      // Notify backend about mode switch
      await fetch('/api/chat-slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          action: 'initiate',
          conversationHistory: updatedMessages
        })
      });
    } catch (error) {
      console.error('Failed to switch to human:', error);
    }
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
  };

  return (
    <div className="chat-widget">
      <button 
        className="chat-toggle" 
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
      
      {isOpen && (
        <ChatWindow
          session={session}
          onSendMessage={sendMessage}
          onSwitchToHuman={switchToHuman}
          onQuickAction={handleQuickAction}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};
