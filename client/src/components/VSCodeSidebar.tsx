import React, { useState } from 'react';
import './VSCodeSidebar.css';

interface FileItem {
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

interface VSCodeSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  currentFile?: string;
  onFileSelect?: (file: FileItem) => void;
  files?: FileItem[];
  onNewFileClick?: () => void;
  onNewFolderClick?: () => void;
  onOpenLocalFolder?: () => void;
}

const VSCodeSidebar: React.FC<VSCodeSidebarProps> = ({
  isVisible,
  onToggle,
  currentFile,
  onFileSelect,
  files = [],
  onNewFileClick,
  onNewFolderClick,
  onOpenLocalFolder
}) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'search' | 'extensions'>('explorer');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: FileItem): string => {
    if (file.type === 'folder') return '📁';
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      'js': '📄',
      'ts': '📘',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚡',
      'c': '⚡',
      'cs': '🔷',
      'go': '🐹',
      'rs': '🦀',
      'php': '🐘',
      'rb': '💎',
      'json': '⚙️',
      'md': '📖',
      'txt': '📝',
      'html': '🌐',
      'css': '🎨',
      'xml': '📋',
      'yml': '⚙️',
      'yaml': '⚙️'
    };
    
    return iconMap[ext || ''] || '📄';
  };

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => (
      <div key={item.id} className="file-tree-item">
        <div
          className={`file-item ${item.path === currentFile ? 'active' : ''}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.path);
            } else if (onFileSelect) {
              onFileSelect(item);
            }
          }}
        >
          {item.type === 'folder' && (
            <span className={`folder-arrow ${expandedFolders.has(item.path) ? 'expanded' : ''}`}>
              ▶
            </span>
          )}
          <span className="file-icon">{getFileIcon(item)}</span>
          <span className="file-name">{item.name}</span>
        </div>
        
        {item.type === 'folder' && expandedFolders.has(item.path) && item.children && (
          <div className="folder-contents">
            {renderFileTree(item.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={`vscode-sidebar ${!isVisible ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className={`sidebar-toggle ${!isVisible ? 'collapsed' : ''}`} onClick={onToggle}>
          {isVisible ? '◀' : '▶'}
        </button>
      </div>

      <div className={`sidebar-content ${!isVisible ? 'hidden' : ''}`}>
        {activeTab === 'explorer' && (
          <div className="explorer-panel">
            <div className="panel-header">
              <h3>EXPLORER</h3>
              <div className="panel-actions">
                {onOpenLocalFolder && (
                  <button title="Open Local Folder" onClick={onOpenLocalFolder}>📂</button>
                )}
                {onNewFileClick && (
                  <button title="New File" onClick={onNewFileClick}>📄</button>
                )}
                {onNewFolderClick && (
                  <button title="New Folder" onClick={onNewFolderClick}>📁</button>
                )}
                <button title="Refresh">🔄</button>
                <button title="Collapse All">📋</button>
              </div>
            </div>
            <div className="file-explorer">
              {files.length > 0 ? (
                renderFileTree(files)
              ) : (
                <div className="empty-state">
                  <p>No files yet</p>
                  <p>Create your first file to get started!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="search-panel">
            <div className="panel-header">
              <h3>SEARCH</h3>
            </div>
            <div className="search-content">
              <input
                type="text"
                placeholder="Search files..."
                className="search-input"
              />
              <input
                type="text"
                placeholder="Replace..."
                className="search-input"
              />
              <div className="search-options">
                <button className="search-option" title="Match Case">Aa</button>
                <button className="search-option" title="Match Whole Word">ab</button>
                <button className="search-option" title="Use Regular Expression">.*</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'extensions' && (
          <div className="extensions-panel">
            <div className="panel-header">
              <h3>EXTENSIONS</h3>
            </div>
            <div className="extensions-content">
              <p>Extensions panel coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Show tab icons when sidebar is collapsed */}
      {!isVisible && (
        <div className="sidebar-icons">
          <button
            className={`sidebar-icon ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
            title="Explorer"
          >
            📁
          </button>
          <button
            className={`sidebar-icon ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            title="Search"
          >
            🔍
          </button>
          <button
            className={`sidebar-icon ${activeTab === 'extensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('extensions')}
            title="Extensions"
          >
            🧩
          </button>
        </div>
      )}

      <div className={`sidebar-footer ${!isVisible ? 'hidden' : ''}`}>
        <div className="tab-bar">
          <button
            className={`tab ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
            title="Explorer"
          >
            📁
          </button>
          <button
            className={`tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            title="Search"
          >
            🔍
          </button>
          <button
            className={`tab ${activeTab === 'extensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('extensions')}
            title="Extensions"
          >
            🧩
          </button>
        </div>
      </div>
    </div>
  );
};

export default VSCodeSidebar;