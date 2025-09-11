import React from 'react';
import './CursorDisplay.css';

interface CursorPosition {
  lineNumber: number;
  column: number;
}

interface UserCursor {
  userId: string;
  position: CursorPosition;
  color: string;
  displayName: string;
  avatar?: string;
  timestamp: Date;
}

interface UserSelection {
  userId: string;
  selection: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  color: string;
  displayName: string;
  avatar?: string;
  timestamp: Date;
}

interface CursorDisplayProps {
  userCursors: Map<string, UserCursor>;
  userSelections: Map<string, UserSelection>;
  currentUserId?: string;
  editorRef?: React.RefObject<any>;
  followRelationship?: { followingId: string; followingName: string; startedAt: Date } | null;
}

const CursorDisplay: React.FC<CursorDisplayProps> = ({
  userCursors,
  userSelections,
  currentUserId,
  editorRef,
  followRelationship
}) => {
  // Filter out current user's cursor
  const otherUserCursors = Array.from(userCursors.entries())
    .filter(([userId]) => userId !== currentUserId)
    .map(([, cursor]) => cursor);

  const otherUserSelections = Array.from(userSelections.entries())
    .filter(([userId]) => userId !== currentUserId)
    .map(([, selection]) => selection);

  // Calculate cursor position in pixels
  const getCursorPosition = (position: CursorPosition) => {
    if (!editorRef?.current) return { top: 0, left: 0 };

    try {
      const editor = editorRef.current;
      const monacoEditor = editor.getEditor?.();
      
      if (!monacoEditor) return { top: 0, left: 0 };

      const domNode = monacoEditor.getDomNode();
      if (!domNode) return { top: 0, left: 0 };

      // Get the position in the editor's coordinate system
      const positionInPixels = monacoEditor.getScrolledVisiblePosition(position);
      if (!positionInPixels) return { top: 0, left: 0 };

      // Get the editor's viewport
      const editorRect = domNode.getBoundingClientRect();
      const containerRect = editorRef.current.getBoundingClientRect();

      // Calculate relative position within the container
      const relativeTop = positionInPixels.top - containerRect.top;
      const relativeLeft = positionInPixels.left - containerRect.left;

      return {
        top: Math.max(0, relativeTop),
        left: Math.max(0, relativeLeft)
      };
    } catch (error) {
      console.warn('Error calculating cursor position:', error);
      return { top: 0, left: 0 };
    }
  };

  // Calculate selection position in pixels
  const getSelectionPosition = (selection: UserSelection['selection']) => {
    if (!editorRef?.current) return { top: 0, left: 0, height: 0, width: 0 };

    try {
      const editor = editorRef.current;
      const monacoEditor = editor.getEditor?.();
      
      if (!monacoEditor) return { top: 0, left: 0, height: 0, width: 0 };

      const domNode = monacoEditor.getDomNode();
      if (!domNode) return { top: 0, left: 0, height: 0, width: 0 };

      const startPosition = monacoEditor.getScrolledVisiblePosition({
        lineNumber: selection.startLineNumber,
        column: selection.startColumn
      });
      
      const endPosition = monacoEditor.getScrolledVisiblePosition({
        lineNumber: selection.endLineNumber,
        column: selection.endColumn
      });

      if (!startPosition || !endPosition) return { top: 0, left: 0, height: 0, width: 0 };

      const editorRect = domNode.getBoundingClientRect();
      const containerRect = editorRef.current.getBoundingClientRect();

      const top = Math.min(startPosition.top, endPosition.top) - containerRect.top;
      const left = Math.min(startPosition.left, endPosition.left) - containerRect.left;
      const height = Math.abs(endPosition.top - startPosition.top) + 20; // Line height
      const width = Math.abs(endPosition.left - startPosition.left) || 100; // Minimum width

      return { top, left, height, width };
    } catch (error) {
      console.warn('Error calculating selection position:', error);
      return { top: 0, left: 0, height: 0, width: 0 };
    }
  };

  return (
    <div className="cursor-display-container">
      {/* Render user selections */}
      {otherUserSelections.map((selection) => {
        const position = getSelectionPosition(selection.selection);
        const isFollowedUser = followRelationship?.followingId === selection.userId;
        return (
          <div
            key={`selection-${selection.userId}`}
            className={`user-selection ${isFollowedUser ? 'followed-user-selection' : ''}`}
            style={{
              top: position.top,
              left: position.left,
              height: position.height,
              width: position.width,
              backgroundColor: isFollowedUser ? `${selection.color}40` : `${selection.color}20`,
              borderLeft: `3px solid ${selection.color}`,
              boxShadow: isFollowedUser ? `0 0 8px ${selection.color}60` : 'none'
            }}
          >
            <div 
              className={`selection-label ${isFollowedUser ? 'followed-label' : ''}`}
              style={{ backgroundColor: selection.color }}
            >
              {selection.displayName}
              {isFollowedUser && <span className="follow-indicator">👁️</span>}
            </div>
          </div>
        );
      })}

      {/* Render user cursors */}
      {otherUserCursors.map((cursor) => {
        const position = getCursorPosition(cursor.position);
        const isFollowedUser = followRelationship?.followingId === cursor.userId;
        return (
          <div
            key={`cursor-${cursor.userId}`}
            className={`user-cursor ${isFollowedUser ? 'followed-user-cursor' : ''}`}
            style={{
              top: position.top,
              left: position.left,
              borderLeftColor: cursor.color,
              boxShadow: isFollowedUser ? `0 0 8px ${cursor.color}60` : 'none'
            }}
          >
            <div 
              className={`cursor-label ${isFollowedUser ? 'followed-label' : ''}`}
              style={{ backgroundColor: cursor.color }}
            >
              <div className="cursor-avatar">
                {cursor.avatar ? (
                  <img src={cursor.avatar} alt={cursor.displayName} />
                ) : (
                  <span>{cursor.displayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="cursor-name">{cursor.displayName}</span>
              {isFollowedUser && <span className="follow-indicator">👁️</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CursorDisplay;
