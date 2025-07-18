import React, { useState, useEffect } from 'react';
import UserSidebar, { UserInfo } from './UserSidebar';

const UserSidebarDemo: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [users, setUsers] = useState<UserInfo[]>([
    {
      userId: '1',
      displayName: 'Alice Johnson',
      avatar: 'https://i.pravatar.cc/150?img=1',
      socketId: 'socket1',
      online: true,
      isTyping: false,
      isEditing: false,
      status: 'online',
      color: '#FF6B6B'
    },
    {
      userId: '2',
      displayName: 'Bob Smith',
      avatar: 'https://i.pravatar.cc/150?img=2',
      socketId: 'socket2',
      online: true,
      isTyping: true,
      isEditing: false,
      status: 'online',
      color: '#4ECDC4'
    },
    {
      userId: '3',
      displayName: 'Carol Davis',
      avatar: 'https://i.pravatar.cc/150?img=3',
      socketId: 'socket3',
      online: true,
      isTyping: false,
      isEditing: true,
      status: 'busy',
      customMessage: 'Working on the backend API',
      color: '#45B7D1'
    },
    {
      userId: '4',
      displayName: 'David Wilson',
      avatar: 'https://i.pravatar.cc/150?img=4',
      socketId: 'socket4',
      online: false,
      isTyping: false,
      isEditing: false,
      status: 'offline',
      lastSeen: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      color: '#96CEB4'
    },
    {
      userId: '5',
      displayName: 'Eva Brown',
      avatar: 'https://i.pravatar.cc/150?img=5',
      socketId: 'socket5',
      online: true,
      isTyping: false,
      isEditing: false,
      status: 'away',
      customMessage: 'In a meeting',
      color: '#FFEAA7'
    }
  ]);

  const [currentUserId] = useState('1');
  const [roomId] = useState('demo-room-123');

  // Simulate real-time updates
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    // Simulate typing indicators
    intervals.push(setInterval(() => {
      setUsers(prev => prev.map(user => ({
        ...user,
        isTyping: Math.random() > 0.8 ? !user.isTyping : user.isTyping
      })));
    }, 3000));

    // Simulate editing indicators
    intervals.push(setInterval(() => {
      setUsers(prev => prev.map(user => ({
        ...user,
        isEditing: Math.random() > 0.9 ? !user.isEditing : user.isEditing
      })));
    }, 5000));

    // Simulate status changes
    intervals.push(setInterval(() => {
      setUsers(prev => prev.map(user => {
        if (Math.random() > 0.95) {
          const statuses: ('online' | 'away' | 'busy' | 'offline')[] = ['online', 'away', 'busy', 'offline'];
          return {
            ...user,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            online: Math.random() > 0.1
          };
        }
        return user;
      }));
    }, 8000));

    return () => {
      intervals.forEach(clearInterval);
    };
  }, []);

  const handleUserClick = (user: UserInfo) => {
    console.log('User clicked:', user);
    alert(`Clicked on ${user.displayName} (${user.status})`);
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: '#1e1e1e',
      color: '#ffffff',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h1>User Sidebar Demo</h1>
        <p>This demo shows the UserSidebar component with real-time status updates, typing indicators, and editing indicators.</p>
        
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              background: '#007acc',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px',
              marginRight: '10px'
            }}
          >
            {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          
          <button
            onClick={() => {
              const newUser: UserInfo = {
                userId: Date.now().toString(),
                displayName: `User ${Math.floor(Math.random() * 1000)}`,
                socketId: `socket${Date.now()}`,
                online: true,
                isTyping: false,
                isEditing: false,
                status: 'online',
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
              };
              setUsers(prev => [...prev, newUser]);
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '5px',
              background: '#4caf50',
              color: 'white',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Add Random User
          </button>
        </div>

        <div style={{ fontSize: '14px', color: '#888' }}>
          <h3>Features Demonstrated:</h3>
          <ul>
            <li>✅ Real-time online/offline status</li>
            <li>✅ Typing indicators (✏️)</li>
            <li>✅ Editing indicators (💻)</li>
            <li>✅ User status (online, away, busy, offline)</li>
            <li>✅ Custom status messages</li>
            <li>✅ Last seen timestamps</li>
            <li>✅ User search functionality</li>
            <li>✅ Expandable user details</li>
            <li>✅ Color-coded user avatars</li>
            <li>✅ Responsive design</li>
          </ul>
        </div>
      </div>

      <div style={{ 
        background: '#2d2d30', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #3e3e42'
      }}>
        <h3>Main Content Area</h3>
        <p>This area would contain your main application content. The sidebar slides in from the left and pushes this content to the right.</p>
        <p>The sidebar shows {users.filter(u => u.online).length} online users out of {users.length} total users.</p>
      </div>

      <UserSidebar
        users={users}
        currentUserId={currentUserId}
        roomId={roomId}
        isVisible={showSidebar}
        onToggle={() => setShowSidebar(!showSidebar)}
        onUserClick={handleUserClick}
      />
    </div>
  );
};

export default UserSidebarDemo; 