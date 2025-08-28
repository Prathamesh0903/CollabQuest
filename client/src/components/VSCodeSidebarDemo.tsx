import React, { useState } from 'react';
import VSCodeSidebar from './VSCodeSidebar';
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

const VSCodeSidebarDemo: React.FC = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentFile, setCurrentFile] = useState<string>('src/App.tsx');
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);

  // Sample file structure
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'src',
      path: 'src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'App.tsx',
          path: 'src/App.tsx',
          type: 'file',
          language: 'typescript',
          status: 'modified'
        },
        {
          id: '3',
          name: 'index.tsx',
          path: 'src/index.tsx',
          type: 'file',
          language: 'typescript'
        },
        {
          id: '4',
          name: 'components',
          path: 'src/components',
          type: 'folder',
          children: [
            {
              id: '5',
              name: 'Header.tsx',
              path: 'src/components/Header.tsx',
              type: 'file',
              language: 'typescript',
              status: 'added'
            },
            {
              id: '6',
              name: 'Sidebar.tsx',
              path: 'src/components/Sidebar.tsx',
              type: 'file',
              language: 'typescript'
            }
          ]
        },
        {
          id: '7',
          name: 'styles',
          path: 'src/styles',
          type: 'folder',
          children: [
            {
              id: '8',
              name: 'App.css',
              path: 'src/styles/App.css',
              type: 'file',
              language: 'css'
            },
            {
              id: '9',
              name: 'index.css',
              path: 'src/styles/index.css',
              type: 'file',
              language: 'css',
              status: 'untracked'
            }
          ]
        }
      ]
    },
    {
      id: '10',
      name: 'public',
      path: 'public',
      type: 'folder',
      children: [
        {
          id: '11',
          name: 'index.html',
          path: 'public/index.html',
          type: 'file',
          language: 'html'
        },
        {
          id: '12',
          name: 'favicon.ico',
          path: 'public/favicon.ico',
          type: 'file',
          language: 'image'
        }
      ]
    },
    {
      id: '13',
      name: 'package.json',
      path: 'package.json',
      type: 'file',
      language: 'json'
    },
    {
      id: '14',
      name: 'tsconfig.json',
      path: 'tsconfig.json',
      type: 'file',
      language: 'json'
    },
    {
      id: '15',
      name: '.gitignore',
      path: '.gitignore',
      type: 'file',
      language: 'gitignore',
      isHidden: true
    },
    {
      id: '16',
      name: '.env',
      path: '.env',
      type: 'file',
      language: 'env',
      isHidden: true
    }
  ]);

  const handleFileSelect = (file: FileItem) => {
    if (file.type === 'file') {
      setCurrentFile(file.path);
      console.log('Selected file:', file);
    }
  };

  const handleNewFileClick = () => {
    console.log('New file clicked');
    // Add new file logic here
  };

  const handleNewFolderClick = () => {
    console.log('New folder clicked');
    // Add new folder logic here
  };

  const handleOpenLocalFolder = () => {
    console.log('Open local folder clicked');
    // Add open folder logic here
  };

  const handleDeleteFile = (file: FileItem) => {
    console.log('Delete file:', file);
    // Add delete logic here
  };

  const handleRenameFile = (file: FileItem, newName: string) => {
    console.log('Rename file:', file, 'to:', newName);
    // Add rename logic here
  };

  const handleDuplicateFile = (file: FileItem) => {
    console.log('Duplicate file:', file);
    // Add duplicate logic here
  };

  const handleDownloadFile = (file: FileItem) => {
    console.log('Download file:', file);
    // Add download logic here
  };

  const handleToggleHiddenFiles = () => {
    setShowHiddenFiles(!showHiddenFiles);
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      background: '#1e1e1e',
      color: '#cccccc',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <VSCodeSidebar
        isVisible={showSidebar}
        onToggle={() => setShowSidebar(!showSidebar)}
        currentFile={currentFile}
        onFileSelect={handleFileSelect}
        files={files}
        onNewFileClick={handleNewFileClick}
        onNewFolderClick={handleNewFolderClick}
        onOpenLocalFolder={handleOpenLocalFolder}
        onDeleteFile={handleDeleteFile}
        onRenameFile={handleRenameFile}
        onDuplicateFile={handleDuplicateFile}
        onDownloadFile={handleDownloadFile}
        onToggleHiddenFiles={handleToggleHiddenFiles}
        showHiddenFiles={showHiddenFiles}
      />
      
      <div style={{ 
        flex: 1, 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>
          <h1>VS Code Sidebar Demo</h1>
          <p>This demo showcases the enhanced VS Code-like sidebar with professional UI and functionality.</p>
        </div>
        
        <div style={{ 
          background: '#252526', 
          padding: '16px', 
          borderRadius: '6px',
          border: '1px solid #3e3e42'
        }}>
          <h3>Features Demonstrated:</h3>
          <ul style={{ lineHeight: '1.6' }}>
            <li>✅ Professional VS Code-like icons using Lucide React</li>
            <li>✅ File tree with proper indentation and folder expansion</li>
            <li>✅ Context menus with file operations (rename, duplicate, download, delete)</li>
            <li>✅ File status indicators (modified, untracked, added, deleted)</li>
            <li>✅ Hidden files toggle</li>
            <li>✅ Search functionality</li>
            <li>✅ Source control panel</li>
            <li>✅ Extensions panel</li>
            <li>✅ Keyboard shortcuts and accessibility</li>
            <li>✅ Professional styling with animations</li>
          </ul>
        </div>
        
        <div style={{ 
          background: '#252526', 
          padding: '16px', 
          borderRadius: '6px',
          border: '1px solid #3e3e42'
        }}>
          <h3>Current File: {currentFile}</h3>
          <p>Click on files in the sidebar to see them selected here.</p>
        </div>
        
        <div style={{ 
          background: '#252526', 
          padding: '16px', 
          borderRadius: '6px',
          border: '1px solid #3e3e42'
        }}>
          <h3>Try These Actions:</h3>
          <ul style={{ lineHeight: '1.6' }}>
            <li>🖱️ Right-click on any file to see the context menu</li>
            <li>📁 Click on folders to expand/collapse them</li>
            <li>🔍 Use the search tab to filter files</li>
            <li>👁️ Toggle hidden files with the eye icon</li>
            <li>📋 Switch between different panels (Explorer, Search, Source Control, Extensions)</li>
            <li>⌨️ Use keyboard shortcuts (Enter to rename, Escape to cancel)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VSCodeSidebarDemo;
