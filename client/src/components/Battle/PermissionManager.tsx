import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_BASE } from '../../utils/api';
import io from 'socket.io-client';
import './PermissionManager.css';

interface Participant {
  userId: string;
  name: string;
  avatar: string;
  role: 'participant' | 'moderator' | 'host';
  permissions: 'view-only' | 'edit-code' | 'full-access';
  isHost: boolean;
}

interface PermissionManagerProps {
  roomId: string;
  isHost: boolean;
  onPermissionChange?: (participantId: string, newPermissions: string) => void;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({ 
  roomId, 
  isHost, 
  onPermissionChange 
}) => {
  const { currentUser } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [defaultPermissions, setDefaultPermissions] = useState<'view-only' | 'edit-code' | 'full-access'>('edit-code');
  const [allowPermissionChanges, setAllowPermissionChanges] = useState(true);
  const [userPermission, setUserPermission] = useState<'view-only' | 'edit-code' | 'full-access'>('edit-code');
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const token = await currentUser?.getIdToken();
        const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001', {
          auth: { token: token || undefined }
        });
        
        setSocket(newSocket);

        // Listen for permission change events
        newSocket.on('permission-changed', (data: any) => {
          setParticipants(prev => prev.map(p => 
            p.userId === data.userId 
              ? { ...p, permissions: data.newPermissions }
              : p
          ));
          onPermissionChange?.(data.userId, data.newPermissions);
        });

        newSocket.on('default-permissions-changed', (data: any) => {
          setDefaultPermissions(data.newDefaultPermissions);
        });

        newSocket.on('permission-settings-changed', (data: any) => {
          setAllowPermissionChanges(data.allowPermissionChanges);
        });

        return () => {
          newSocket.disconnect();
        };
      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initializeSocket();
  }, [currentUser, onPermissionChange]);

  // Fetch permissions data
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!roomId) return;
      
      try {
        setIsLoading(true);
        const token = await currentUser?.getIdToken();
        const response = await fetch(`${API_BASE}/battle/${roomId}/permissions`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setParticipants(data.participants);
            setDefaultPermissions(data.defaultPermissions);
            setAllowPermissionChanges(data.allowPermissionChanges);
            setUserPermission(data.userPermission);
          }
        }
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, [roomId, currentUser]);

  const handlePermissionChange = async (participantId: string, newPermissions: 'view-only' | 'edit-code' | 'full-access') => {
    if (!socket || !isHost) return;

    try {
      socket.emit('change-permission', {
        roomId,
        targetUserId: participantId,
        newPermissions
      });
    } catch (error) {
      console.error('Failed to change permission:', error);
    }
  };

  const handleDefaultPermissionChange = async (newDefaultPermissions: 'view-only' | 'edit-code' | 'full-access') => {
    if (!socket || !isHost) return;

    try {
      socket.emit('change-default-permissions', {
        roomId,
        newDefaultPermissions
      });
    } catch (error) {
      console.error('Failed to change default permissions:', error);
    }
  };

  const handlePermissionSettingsChange = async (allowChanges: boolean) => {
    if (!socket || !isHost) return;

    try {
      socket.emit('change-permission-settings', {
        roomId,
        allowPermissionChanges: allowChanges
      });
    } catch (error) {
      console.error('Failed to change permission settings:', error);
    }
  };

  const getPermissionIcon = (permissions: string) => {
    switch (permissions) {
      case 'view-only': return '👁️';
      case 'edit-code': return '✏️';
      case 'full-access': return '🔓';
      default: return '❓';
    }
  };

  const getPermissionLabel = (permissions: string) => {
    switch (permissions) {
      case 'view-only': return 'View Only';
      case 'edit-code': return 'Edit Code';
      case 'full-access': return 'Full Access';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="permission-manager">
        <div className="loading">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="permission-manager">
      <div className="permission-header">
        <h3>🔐 Permission Management</h3>
        <div className="user-permission">
          Your Permission: {getPermissionIcon(userPermission)} {getPermissionLabel(userPermission)}
        </div>
      </div>

      {isHost && (
        <div className="permission-settings">
          <div className="setting-group">
            <label>Default Permissions for New Participants:</label>
            <select 
              value={defaultPermissions}
              onChange={(e) => handleDefaultPermissionChange(e.target.value as any)}
              className="permission-select"
            >
              <option value="view-only">👁️ View Only</option>
              <option value="edit-code">✏️ Edit Code</option>
              <option value="full-access">🔓 Full Access</option>
            </select>
          </div>

          <div className="setting-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allowPermissionChanges}
                onChange={(e) => handlePermissionSettingsChange(e.target.checked)}
              />
              Allow permission changes during battle
            </label>
          </div>
        </div>
      )}

      <div className="participants-list">
        <h4>Participants</h4>
        {participants.map((participant) => (
          <div key={participant.userId} className="participant-item">
            <div className="participant-info">
              <span className="avatar">{participant.avatar}</span>
              <span className="name">{participant.name}</span>
              {participant.isHost && <span className="host-badge">Host</span>}
            </div>
            
            <div className="participant-permissions">
              {isHost && allowPermissionChanges && !participant.isHost ? (
                <select
                  value={participant.permissions}
                  onChange={(e) => handlePermissionChange(participant.userId, e.target.value as any)}
                  className="permission-select"
                >
                  <option value="view-only">👁️ View Only</option>
                  <option value="edit-code">✏️ Edit Code</option>
                  <option value="full-access">🔓 Full Access</option>
                </select>
              ) : (
                <span className="permission-display">
                  {getPermissionIcon(participant.permissions)} {getPermissionLabel(participant.permissions)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="permission-info">
        <h5>Permission Levels:</h5>
        <ul>
          <li><strong>👁️ View Only:</strong> Can only view the battle content</li>
          <li><strong>✏️ Edit Code:</strong> Can write, test, and submit code solutions</li>
          <li><strong>🔓 Full Access:</strong> All edit-code permissions plus room management</li>
        </ul>
      </div>
    </div>
  );
};

export default PermissionManager;
