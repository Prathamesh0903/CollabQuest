import React, { useState } from 'react';
import './VSCodeSidebar.css';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  icon: string;
  isExpanded?: boolean;
  children?: FileItem[];
}

interface VSCodeSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
  currentFile?: string;
  onFileSelect?: (file: FileItem) => void;
}

const VSCodeSidebar: React.FC<VSCodeSidebarProps> = ({
  isVisible,
  onToggle,
  currentFile,
  onFileSelect
}) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'search' | 'extensions'>('explorer');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['project-root']));

  // Mock file structure
  const fileStructure: FileItem[] = [
    {
      id: 'project-root',
      name: 'Collaborative Project',
      type: 'folder',
      icon: '📁',
      isExpanded: true,
      children: [
        {
          id: 'src',
          name: 'src',
          type: 'folder',
          icon: '📁',
          isExpanded: false,
          children: [
            { id: 'main.js', name: 'main.js', type: 'file', icon: '📄' },
            { id: 'main.py', name: 'main.py', type: 'file', icon: '🐍' },
            { id: 'utils.js', name: 'utils.js', type: 'file', icon: '📄' },
            { id: 'config.json', name: 'config.json', type: 'file', icon: '⚙️' }
          ]
        },
        {
          id: 'components',
          name: 'components',
          type: 'folder',
          icon: '📁',
          isExpanded: false,
          children: [
            { id: 'Header.js', name: 'Header.js', type: 'file', icon: '⚛️' },
            { id: 'Footer.js', name: 'Footer.js', type: 'file', icon: '⚛️' },
            { id: 'Sidebar.js', name: 'Sidebar.js', type: 'file', icon: '⚛️' }
          ]
        },
        { id: 'package.json', name: 'package.json', type: 'file', icon: '📦' },
        { id: 'README.md', name: 'README.md', type: 'file', icon: '📖' },
        { id: '.gitignore', name: '.gitignore', type: 'file', icon: '🚫' }
      ]
    }
  ];

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => (
      <div key={item.id} className="file-tree-item">
        <div
          className={`file-item ${item.id === currentFile ? 'active' : ''}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.id);
            } else if (onFileSelect) {
              onFileSelect(item);
            }
          }}
        >
          {item.type === 'folder' && (
            <span className={`folder-arrow ${expandedFolders.has(item.id) ? 'expanded' : ''}`}>
              ▶
            </span>
          )}
          <span className="file-icon">{item.icon}</span>
          <span className="file-name">{item.name}</span>
        </div>
        {item.type === 'folder' && expandedFolders.has(item.id) && item.children && (
          <div className="folder-children">
            {renderFileTree(item.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (!isVisible) {
    return (
      <div className="vscode-sidebar-collapsed">
        <button className="sidebar-toggle-btn" onClick={onToggle} title="Show Sidebar">
          ▶
        </button>
        <div className="sidebar-icons">
          <div className="sidebar-icon active" title="Explorer">
            📁
          </div>
          <div className="sidebar-icon" title="Search">
            🔍
          </div>
          <div className="sidebar-icon" title="Extensions">
            🧩
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vscode-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-tabs">
          <div
            className={`sidebar-tab ${activeTab === 'explorer' ? 'active' : ''}`}
            onClick={() => setActiveTab('explorer')}
            title="Explorer"
          >
            📁
          </div>
          <div
            className={`sidebar-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            title="Search"
          >
            🔍
          </div>
          <div
            className={`sidebar-tab ${activeTab === 'extensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('extensions')}
            title="Extensions"
          >
            🧩
          </div>
        </div>
        <button className="sidebar-toggle-btn" onClick={onToggle} title="Hide Sidebar">
          ◀
        </button>
      </div>

      <div className="sidebar-content">
        {activeTab === 'explorer' && (
          <div className="explorer-panel">
            <div className="panel-header">
              <h3>EXPLORER</h3>
              <div className="panel-actions">
                <button title="New File">📄</button>
                <button title="New Folder">📁</button>
                <button title="Refresh">🔄</button>
                <button title="Collapse All">📋</button>
              </div>
            </div>
            <div className="file-explorer">
              {renderFileTree(fileStructure)}
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
              <div className="extension-item">
                <div className="extension-icon">🎨</div>
                <div className="extension-info">
                  <div className="extension-name">Theme - Dark+</div>
                  <div className="extension-desc">Default dark theme</div>
                </div>
              </div>
              <div className="extension-item">
                <div className="extension-icon">📝</div>
                <div className="extension-info">
                  <div className="extension-name">Code Formatter</div>
                  <div className="extension-desc">Auto format code</div>
                </div>
              </div>
              <div className="extension-item">
                <div className="extension-icon">🔧</div>
                <div className="extension-info">
                  <div className="extension-name">Collaborative Tools</div>
                  <div className="extension-desc">Real-time collaboration</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VSCodeSidebar;