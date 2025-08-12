import React from 'react';

interface ChatProps {
  roomId: string;
  socket: any;
  isVisible: boolean;
  onToggle: () => void;
}

const Chat: React.FC<ChatProps> = ({ roomId, socket, isVisible, onToggle }) => {
  return <div>Chat component is working</div>;
};

export default Chat;
