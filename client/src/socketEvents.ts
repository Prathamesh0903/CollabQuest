// Socket event interfaces for client/server communication

// User joined a room
export interface UserJoinedEvent {
  userId: string;
  displayName: string;
  avatar?: string;
  joinedAt: string | Date;
  roomId: string;
}

// User left a room
export interface UserLeftEvent {
  userId: string;
  displayName: string;
  leftAt: string | Date;
  roomId: string;
}

// Room created event
export interface RoomCreatedEvent {
  roomId: string;
  name: string;
  createdBy: string;
  createdAt: string | Date;
  language: string;
  mode: 'battle' | 'collab';
}

// Participant joined/left (for battles/teams)
export interface ParticipantJoinedEvent {
  userId: string;
  displayName: string;
  teamId?: string;
  joinedAt: string | Date;
}
export interface ParticipantLeftEvent {
  userId: string;
  displayName: string;
  teamId?: string;
  leftAt: string | Date;
}

// Code update event (collaborative editor)
export interface CodeUpdateEvent {
  roomId: string;
  userId: string;
  displayName: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  text: string;
  version: number;
  timestamp: string | Date;
}

// Full code sync event
export interface CodeSyncEvent {
  roomId: string;
  code: string;
  version: number;
  userId: string;
  displayName: string;
  timestamp: string | Date;
}

// Problem solved event (for battles/quizzes)
export interface ProblemSolvedEvent {
  userId: string;
  displayName: string;
  roomId: string;
  problemId: string;
  solvedAt: string | Date;
  score: number;
}

// Leaderboard update event
export interface LeaderboardUpdateEvent {
  roomId: string;
  leaderboard: Array<{
    userId: string;
    displayName: string;
    score: number;
    rank: number;
  }>;
  updatedAt: string | Date;
}

// General user info (for users-in-room, etc.)
export interface UserInfo {
  userId: string;
  displayName: string;
  avatar?: string;
  socketId?: string;
  online: boolean;
  isTyping?: boolean;
  isEditing?: boolean;
  lastSeen?: string | Date;
  status?: 'online' | 'away' | 'busy' | 'offline';
  customMessage?: string;
  color?: string;
  role?: 'participant' | 'moderator' | 'host';
  permissions?: 'view-only' | 'edit-code' | 'full-access';
}

// Permission change events
export interface PermissionChangedEvent {
  roomId: string;
  userId: string;
  displayName: string;
  oldPermissions: 'view-only' | 'edit-code' | 'full-access';
  newPermissions: 'view-only' | 'edit-code' | 'full-access';
  changedBy: string;
  changedAt: string | Date;
}

export interface DefaultPermissionsChangedEvent {
  roomId: string;
  oldDefaultPermissions: 'view-only' | 'edit-code' | 'full-access';
  newDefaultPermissions: 'view-only' | 'edit-code' | 'full-access';
  changedBy: string;
  changedAt: string | Date;
}

export interface PermissionSettingsChangedEvent {
  roomId: string;
  allowPermissionChanges: boolean;
  changedBy: string;
  changedAt: string | Date;
}

// Permission validation response
export interface PermissionValidationEvent {
  roomId: string;
  userId: string;
  action: string;
  hasPermission: boolean;
  userPermission: 'view-only' | 'edit-code' | 'full-access';
  requiredPermission: 'view-only' | 'edit-code' | 'full-access';
  message?: string;
}

// Example: Socket event name mapping (for reference)
export type SocketEventMap = {
  'user-joined-room': UserJoinedEvent;
  'user-left-room': UserLeftEvent;
  'room-created': RoomCreatedEvent;
  'participant-joined': ParticipantJoinedEvent;
  'participant-left': ParticipantLeftEvent;
  'code-change': CodeUpdateEvent;
  'code-sync': CodeSyncEvent;
  'problem-solved': ProblemSolvedEvent;
  'leaderboard-update': LeaderboardUpdateEvent;
  'users-in-room': UserInfo[];
  'permission-changed': PermissionChangedEvent;
  'default-permissions-changed': DefaultPermissionsChangedEvent;
  'permission-settings-changed': PermissionSettingsChangedEvent;
  'permission-validation': PermissionValidationEvent;
}; 