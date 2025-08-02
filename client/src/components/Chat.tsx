import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Chat.css';

interface Message {
  _id: string;
  roomId: string;
  sender: {
    userId: string;
    displayName: string;
    avatar?: string;
  };
  content: string;
  type: 'text' | 'system' | 'code' | 'file' | 'reaction';
  metadata?: {
    language?: string;
    fileName?: string;
    fileSize?: number;
    reactions?: Array<{
      userId: string;
      emoji: string;
      displayName: string;
    }>;
  };
  isEdited: boolean;
  isDeleted: boolean;
  timestamp: string;
  editedAt?: string;
}

interface TypingUser {
  userId: string;
  displayName: string;
  isTyping: boolean;
}

interface ChatProps {
  roomId: string;
  socket: any;
  isVisible: boolean;
  onToggle: () => void;
}

const Chat: React.FC<ChatProps> = ({ roomId, socket, isVisible, onToggle }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadMessages = useCallback(async () => {
    if (!roomId) return;
    
    setIsLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:5000/api/messages/room/${roomId}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setHasMoreMessages(data.hasMore);
      } else {
        console.error('Failed to load messages');
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, roomId]);

  // Load initial messages
  useEffect(() => {
    if (roomId && isVisible) {
      loadMessages();
    }
  }, [roomId, isVisible, loadMessages]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    const handleUserTyping = (data: TypingUser) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(user => user.userId !== data.userId);
        if (data.isTyping) {
          return [...filtered, data];
        }
        return filtered;
      });
    };

    const handleError = (error: { message: string }) => {
      console.error('Chat error:', error.message);
      // You can add toast notification here
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('error', handleError);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('error', handleError);
    };
  }, [socket]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  

  const loadMoreMessages = async () => {
    if (!roomId || loadingMore || !hasMoreMessages) return;
    
    setLoadingMore(true);
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(
        `http://localhost:5000/api/messages/room/${roomId}?limit=20&skip=${messages.length}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !socket || !roomId) return;

    const messageContent = inputValue.trim();
    setInputValue('');

    // Stop typing indicator
    setIsTyping(false);
    socket.emit('typing-stop', { roomId });

    // Send message via socket
    socket.emit('send-message', {
      roomId,
      content: messageContent,
      type: 'text'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Handle typing indicators
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing-start', { roomId });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('typing-stop', { roomId });
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const shouldShowDate = (message: Message, index: number) => {
    if (index === 0) return true;
    
    const currentDate = new Date(message.timestamp).toDateString();
    const previousDate = new Date(messages[index - 1].timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  const shouldShowSender = (message: Message, index: number) => {
    if (index === 0) return true;
    
    const currentSender = message.sender.userId;
    const previousSender = messages[index - 1].sender.userId;
    const timeDiff = new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime();
    
    return currentSender !== previousSender || timeDiff > 5 * 60 * 1000; // 5 minutes
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const token = await currentUser?.getIdToken();
      const response = await fetch(`http://localhost:5000/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      });

      if (response.ok) {
        const { data } = await response.json();
        setMessages(prev => 
          prev.map(msg => msg._id === messageId ? data : msg)
        );
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isOwnMessage = message.sender.userId === currentUser?.uid;
    const showDate = shouldShowDate(message, index);
    const showSender = shouldShowSender(message, index);

    return (
      <div key={message._id} className="message-container">
        {showDate && (
          <div className="message-date-divider">
            <span>{formatDate(message.timestamp)}</span>
          </div>
        )}
        
        <div className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}>
          {showSender && !isOwnMessage && (
            <div className="message-sender">
              <span className="sender-name">{message.sender.displayName}</span>
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
          )}
          
          <div className="message-content">
            {message.isDeleted ? (
              <em className="deleted-message">This message was deleted</em>
            ) : (
              <>
                <div className="message-text">
                  {message.content}
                  {message.isEdited && <span className="edited-indicator"> (edited)</span>}
                </div>
                
                {message.metadata?.reactions && message.metadata.reactions.length > 0 && (
                  <div className="message-reactions">
                    {message.metadata.reactions.map((reaction, idx) => (
                      <button
                        key={`${reaction.emoji}-${idx}`}
                        className="reaction-button"
                        onClick={() => handleReaction(message._id, reaction.emoji)}
                        title={`${reaction.displayName} reacted with ${reaction.emoji}`}
                      >
                        {reaction.emoji} {message.metadata?.reactions?.filter(r => r.emoji === reaction.emoji).length}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          
          {isOwnMessage && (
            <div className="message-actions">
              <button className="action-button" onClick={() => handleReaction(message._id, '👍')}>
                👍
              </button>
              <button className="action-button" onClick={() => handleReaction(message._id, '❤️')}>
                ❤️
              </button>
              <button className="action-button" onClick={() => handleReaction(message._id, '😂')}>
                😂
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isVisible) {
    return (
      <div className="chat-toggle-button" onClick={onToggle}>
        💬 Chat
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>💬 Room Chat</h3>
        <button className="close-button" onClick={onToggle}>×</button>
      </div>

      <div className="chat-messages" ref={chatContainerRef}>
        {loadingMore && (
          <div className="loading-more">
            Loading more messages...
          </div>
        )}
        
        {hasMoreMessages && !loadingMore && (
          <button className="load-more-button" onClick={loadMoreMessages}>
            Load More Messages
          </button>
        )}

        {isLoading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : (
          messages.map(renderMessage)
        )}

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.map(user => user.displayName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="chat-input"
          maxLength={2000}
        />
        <button 
          onClick={sendMessage}
          disabled={!inputValue.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat; 