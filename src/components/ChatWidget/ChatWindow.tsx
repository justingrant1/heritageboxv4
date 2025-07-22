import React from 'react';
import { Message, ExtendedChatSession } from '../../utils/chatUtils';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { QuickActions } from './QuickActions';

interface ChatWindowProps {
  session: ExtendedChatSession | null;
  onSendMessage: (message: string) => void;
  onSwitchToHuman: () => void;
  onQuickAction: (message: string) => void;
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  session,
  onSendMessage,
  onSwitchToHuman,
  onQuickAction,
  isLoading
}) => {
  if (!session) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <div className="chat-avatar">🎞️</div>
          <div className="chat-info">
            <h3>Heritagebox Assistant</h3>
            <p>Loading...</p>
          </div>
        </div>
        <div className="chat-messages">
          <div className="loading-spinner">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showQuickActions = session.messages.length === 1 && session.mode === 'ai';

  return (
    <div className="chat-window open">
      <div className="chat-header">
        <div className="chat-avatar">🎞️</div>
        <div className="chat-info">
          <h3>Heritagebox Assistant</h3>
          <p>
            {session.mode === 'ai' 
              ? 'Here to help with your digitization needs'
              : 'Connected to live agent'
            }
          </p>
        </div>
        {session.mode === 'ai' && (
          <button 
            className="human-handoff-btn"
            onClick={onSwitchToHuman}
            title="Talk to a human"
          >
            👤
          </button>
        )}
      </div>
      
      <div className="chat-messages-container">
        <MessageList 
          messages={session.messages} 
          isLoading={isLoading}
        />
        
        {showQuickActions && (
          <QuickActions onQuickAction={onQuickAction} />
        )}
      </div>
      
      <MessageInput 
        onSendMessage={onSendMessage}
        disabled={isLoading}
        placeholder={
          session.mode === 'ai' 
            ? "Type your message..."
            : "Message our team..."
        }
      />
    </div>
  );
};
