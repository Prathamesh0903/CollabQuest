import React, { useState, useRef, useEffect } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Settings,
  GitBranch,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Copy,
  Edit,
  Download,
  Upload,
  FolderOpen,
  FileText,
  Code,
  Image,
  Archive,
  Database,
  Globe,
  Palette,
  Package,
  Lock,
  Star,
  Eye,
  EyeOff,
  ChevronLeft
} from 'lucide-react';
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
  status?: 'modified' | 'untracked' | 'deleted' | 'added';
  isHidden?: boolean;
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
  onDeleteFile?: (file: FileItem) => void;
  onRenameFile?: (file: FileItem, newName: string) => void;
  onDuplicateFile?: (file: FileItem) => void;
  onDownloadFile?: (file: FileItem) => void;
  onToggleHiddenFiles?: () => void;
  showHiddenFiles?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  file: FileItem;
  onClose: () => void;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDownload: () => void;
  onCopyPath: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x, y, file, onClose, onDelete, onRename, onDuplicate, onDownload, onCopyPath
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={menuRef}
      className="context-menu" 
      style={{ left: x, top: y }}
    >
                  <div className="context-menu-item" onClick={onRename}>
              <Edit size={14} />
              <span>Rename</span>
            </div>
      <div className="context-menu-item" onClick={onDuplicate}>
        <Copy size={14} />
        <span>Duplicate</span>
      </div>
      <div className="context-menu-item" onClick={onDownload}>
        <Download size={14} />
        <span>Download</span>
      </div>
      <div className="context-menu-item" onClick={onCopyPath}>
        <FileText size={14} />
        <span>Copy Path</span>
      </div>
      <div className="context-menu-divider"></div>
      <div className="context-menu-item danger" onClick={onDelete}>
        <Trash2 size={14} />
        <span>Delete</span>
      </div>
    </div>
  );
};

const VSCodeSidebar: React.FC<VSCodeSidebarProps> = ({
  isVisible,
  onToggle,
  currentFile,
  onFileSelect,
  files = [],
  onNewFileClick,
  onNewFolderClick,
  onOpenLocalFolder,
  onDeleteFile,
  onRenameFile,
  onDuplicateFile,
  onDownloadFile,
  onToggleHiddenFiles,
  showHiddenFiles = false
}) => {
  const [activeTab, setActiveTab] = useState<'explorer' | 'search' | 'source-control' | 'extensions'>('explorer');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: FileItem;
  } | null>(null);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.path) ? <Folder size={16} /> : <Folder size={16} />;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: React.ReactNode } = {
      'js': <Code size={16} />,
      'ts': <Code size={16} />,
      'jsx': <Code size={16} />,
      'tsx': <Code size={16} />,
      'py': <Code size={16} />,
      'java': <Code size={16} />,
      'cpp': <Code size={16} />,
      'c': <Code size={16} />,
      'cs': <Code size={16} />,
      'go': <Code size={16} />,
      'rs': <Code size={16} />,
      'php': <Code size={16} />,
      'rb': <Code size={16} />,
      'json': <FileText size={16} />,
      'md': <FileText size={16} />,
      'txt': <FileText size={16} />,
      'html': <Globe size={16} />,
      'css': <Palette size={16} />,
      'scss': <Palette size={16} />,
      'sass': <Palette size={16} />,
      'xml': <FileText size={16} />,
      'yml': <FileText size={16} />,
      'yaml': <FileText size={16} />,
      'png': <Image size={16} />,
      'jpg': <Image size={16} />,
      'jpeg': <Image size={16} />,
      'gif': <Image size={16} />,
      'svg': <Image size={16} />,
      'zip': <Archive size={16} />,
      'rar': <Archive size={16} />,
      'tar': <Archive size={16} />,
      'gz': <Archive size={16} />,
      'sql': <Database size={16} />,
      'db': <Database size={16} />,
      'lock': <Lock size={16} />,
      'gitignore': <GitBranch size={16} />,
      'env': <Settings size={16} />,
      'config': <Settings size={16} />,
      'package': <Package size={16} />
    };
    
    return iconMap[ext || ''] || <File size={16} />;
  };

  const getFileStatusIcon = (file: FileItem) => {
    if (!file.status) return null;
    
    const statusIcons = {
      modified: <div className="status-dot modified" title="Modified" />,
      untracked: <div className="status-dot untracked" title="Untracked" />,
      deleted: <div className="status-dot deleted" title="Deleted" />,
      added: <div className="status-dot added" title="Added" />
    };
    
    return statusIcons[file.status];
  };

  const handleContextMenu = (event: React.MouseEvent, file: FileItem) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      file
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (contextMenu && onDeleteFile) {
      onDeleteFile(contextMenu.file);
    }
    closeContextMenu();
  };

  const handleRename = () => {
    if (contextMenu) {
      setRenamingFile(contextMenu.file);
      setRenameValue(contextMenu.file.name);
    }
    closeContextMenu();
  };

  const handleDuplicate = () => {
    if (contextMenu && onDuplicateFile) {
      onDuplicateFile(contextMenu.file);
    }
    closeContextMenu();
  };

  const handleDownload = () => {
    if (contextMenu && onDownloadFile) {
      onDownloadFile(contextMenu.file);
    }
    closeContextMenu();
  };

  const handleCopyPath = () => {
    if (contextMenu) {
      navigator.clipboard.writeText(contextMenu.file.path);
    }
    closeContextMenu();
  };

  const handleRenameSubmit = () => {
    if (renamingFile && onRenameFile && renameValue.trim()) {
      onRenameFile(renamingFile, renameValue.trim());
    }
    setRenamingFile(null);
    setRenameValue('');
  };

  const handleRenameCancel = () => {
    setRenamingFile(null);
    setRenameValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleRenameSubmit();
    } else if (event.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const filteredFiles = files.filter(file => {
    if (!showHiddenFiles && file.isHidden) return false;
    if (searchQuery) {
      return file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             file.path.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map((item) => (
      <div key={item.id} className="file-tree-item">
        <div
          className={`file-item ${item.path === currentFile ? 'active' : ''} ${item.status || ''}`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
          onClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.path);
            } else if (onFileSelect) {
              onFileSelect(item);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, item)}
          onDoubleClick={() => {
            if (item.type === 'folder') {
              toggleFolder(item.path);
            }
          }}
        >
          {item.type === 'folder' && (
            <span className={`folder-arrow ${expandedFolders.has(item.path) ? 'expanded' : ''}`}>
              {expandedFolders.has(item.path) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          )}
          
          <span className="file-icon">
            {getFileIcon(item)}
          </span>
          
          {renamingFile?.id === item.id ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleRenameSubmit}
              autoFocus
              className="rename-input"
            />
          ) : (
            <span className="file-name">{item.name}</span>
          )}
          
          {getFileStatusIcon(item)}
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
          {isVisible ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      <div className={`sidebar-content ${!isVisible ? 'hidden' : ''}`}>
        {activeTab === 'explorer' && (
          <div className="explorer-panel">
            <div className="panel-header">
              <h3>EXPLORER</h3>
              <div className="panel-actions">
                {onToggleHiddenFiles && (
                  <button 
                    title={showHiddenFiles ? "Hide Hidden Files" : "Show Hidden Files"}
                    onClick={onToggleHiddenFiles}
                    className={showHiddenFiles ? 'active' : ''}
                  >
                    {showHiddenFiles ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
                {onOpenLocalFolder && (
                  <button title="Open Local Folder" onClick={onOpenLocalFolder}>
                    <FolderOpen size={14} />
                  </button>
                )}
                {onNewFileClick && (
                  <button title="New File" onClick={onNewFileClick}>
                    <File size={14} />
                  </button>
                )}
                {onNewFolderClick && (
                  <button title="New Folder" onClick={onNewFolderClick}>
                    <Folder size={14} />
                  </button>
                )}
                <button title="Refresh">
                  <RefreshCw size={14} />
                </button>
                <button title="More Actions">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
            <div className="file-explorer">
              {filteredFiles.length > 0 ? (
                renderFileTree(filteredFiles)
              ) : (
                <div className="empty-state">
                  <Folder size={48} />
                  <p>No files yet</p>
                  <p>Create your first file to get started!</p>
                  <button onClick={onNewFileClick} className="empty-state-btn">
                    <Plus size={16} />
                    New File
                  </button>
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
              <div className="search-input-container">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="search-options">
                <button className="search-option" title="Match Case">Aa</button>
                <button className="search-option" title="Match Whole Word">ab</button>
                <button className="search-option" title="Use Regular Expression">.*</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'source-control' && (
          <div className="source-control-panel">
            <div className="panel-header">
              <h3>SOURCE CONTROL</h3>
            </div>
            <div className="source-control-content">
              <div className="scm-provider">
                <GitBranch size={16} />
                <span>Git</span>
              </div>
              <div className="scm-actions">
                <button className="scm-btn">
                  <Plus size={14} />
                  <span>Stage All Changes</span>
                </button>
                <button className="scm-btn">
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
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
              <div className="extensions-search">
                <Search size={14} />
                <input
                  type="text"
                  placeholder="Search extensions..."
                  className="extensions-search-input"
                />
              </div>
              <div className="extensions-list">
                <p>Extensions panel coming soon...</p>
              </div>
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
            <Folder size={16} />
          </button>
          <button
            className={`sidebar-icon ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            title="Search"
          >
            <Search size={16} />
          </button>
          <button
            className={`sidebar-icon ${activeTab === 'source-control' ? 'active' : ''}`}
            onClick={() => setActiveTab('source-control')}
            title="Source Control"
          >
            <GitBranch size={16} />
          </button>
          <button
            className={`sidebar-icon ${activeTab === 'extensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('extensions')}
            title="Extensions"
          >
            <Package size={16} />
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
            <Folder size={16} />
          </button>
          <button
            className={`tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
            title="Search"
          >
            <Search size={16} />
          </button>
          <button
            className={`tab ${activeTab === 'source-control' ? 'active' : ''}`}
            onClick={() => setActiveTab('source-control')}
            title="Source Control"
          >
            <GitBranch size={16} />
          </button>
          <button
            className={`tab ${activeTab === 'extensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('extensions')}
            title="Extensions"
          >
            <Package size={16} />
          </button>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onClose={closeContextMenu}
          onDelete={handleDelete}
          onRename={handleRename}
          onDuplicate={handleDuplicate}
          onDownload={handleDownload}
          onCopyPath={handleCopyPath}
        />
      )}
    </div>
  );
};

export default VSCodeSidebar;