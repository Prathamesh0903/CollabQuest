import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import Chat from './Chat';
import './ChatDemo.css';

const ChatDemo: React.FC = () => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId] = useState('demo-room-123');
  const [showChat, setShowChat] = useState(false);

  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    const initializeSocket = async () => {
      try {
        const token = await currentUser.getIdToken();
        
        socketRef.current = io('http://localhost:5000', {
          auth: { token },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
          console.log('Connected to chat server');
          setIsConnected(true);
          setSocket(socket);
          
          // Join the demo room
          socket.emit('join-room', { roomId });
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from chat server');
          setIsConnected(false);
        });

        socket.on('error', (error: any) => {
          console.error('Socket error:', error);
        });

        return () => {
          socket.disconnect();
        };
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initializeSocket();
  }, [currentUser, roomId]);

  if (!currentUser) {
    return (
      <div className="chat-demo-container">
        <div className="chat-demo-login">
          <h2>Please log in to use the chat</h2>
          <p>You need to be authenticated to access the real-time chat feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-demo-container">
      <div className="chat-demo-header">
        <h1>💬 Real-Time Chat Demo</h1>
        <p>Experience the power of Socket.IO with real-time messaging</p>
        
        <div className="demo-info">
          <div className="info-card">
            <h3>✅ Features</h3>
            <ul>
              <li>Real-time messaging with Socket.IO</li>
              <li>Message persistence in database</li>
              <li>Typing indicators</li>
              <li>Message reactions</li>
              <li>Room-based message isolation</li>
              <li>User authentication</li>
              <li>Message timestamps</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h3>🔧 Technical Stack</h3>
            <ul>
              <li><strong>Frontend:</strong> React + TypeScript</li>
              <li><strong>Backend:</strong> Node.js + Express</li>
              <li><strong>Real-time:</strong> Socket.IO</li>
              <li><strong>Database:</strong> MongoDB + Mongoose</li>
              <li><strong>Auth:</strong> Firebase Authentication</li>
            </ul>
          </div>
        </div>

        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'}
          </span>
          <span className="status-text">
            {isConnected ? 'Connected to server' : 'Disconnected'}
          </span>
        </div>

        <div className="demo-actions">
          <button 
            className="demo-button primary"
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? 'Hide Chat' : 'Open Chat'}
          </button>
          
          <div className="demo-instructions">
            <h4>How to test:</h4>
            <ol>
              <li>Open this demo in multiple browser tabs/windows</li>
              <li>Log in with different accounts or the same account</li>
              <li>Click "Open Chat" to start messaging</li>
              <li>Type messages and see them appear in real-time</li>
              <li>Try the typing indicators and reactions</li>
            </ol>
          </div>
        </div>
      </div>

      <Chat
        roomId={roomId}
        socket={socket}
        isVisible={showChat}
        onToggle={() => setShowChat(!showChat)}
      />
    </div>
  );
};

export default ChatDemo; 