export interface EditorChange {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  text: string;
}

export interface CollaborativeEditorProps {
  sessionId?: string;
  language?: 'javascript' | 'python' | 'java' | 'cpp' | 'csharp' | 'typescript' | 'go' | 'rust' | 'php' | 'ruby';
  initialCode?: string;
}

export interface UserInfo {
  userId: string;
  displayName: string;
  avatar?: string;
  isTyping?: boolean;
  isEditing?: boolean;
  lastSeen?: Date;
}

export interface CursorInfo {
  position: { lineNumber: number; column: number };
  color: string;
  displayName: string;
  avatar?: string;
}

export interface SelectionInfo {
  range: { startLineNumber: number; startColumn: number; endLineNumber: number; endColumn: number };
  color: string;
  displayName: string;
  avatar?: string;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
  size?: number;
  children?: FileItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileEntity {
  id: string;
  name: string;
  path: string;
  language?: string;
  content: string;
  version: number;
}

export interface SessionState {
  code: string;
  language: string;
  version: number;
  lastExecution?: any;
  files: FileItem[];
  currentFile?: string;
}



