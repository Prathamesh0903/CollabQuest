# Enhanced VS Code Sidebar Component

A professional, feature-rich sidebar component that mimics the functionality and appearance of Visual Studio Code's sidebar.

## Features

### 🎨 Professional UI
- **VS Code-like Design**: Authentic dark theme with proper color schemes
- **Lucide React Icons**: Professional, consistent iconography
- **Smooth Animations**: Folder expansion/collapse animations
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Keyboard navigation and screen reader support

### 📁 File Explorer
- **Hierarchical File Tree**: Nested folders with proper indentation
- **File Type Icons**: Different icons for various file types (code, images, config files, etc.)
- **Status Indicators**: Visual indicators for modified, untracked, added, and deleted files
- **Hidden Files Toggle**: Show/hide hidden files (files starting with `.`)
- **File Selection**: Click to select files, double-click to expand folders

### 🖱️ Context Menus
- **Right-click Context Menu**: Professional context menu with file operations
- **File Operations**:
  - Rename files and folders
  - Duplicate files
  - Download files
  - Copy file path
  - Delete files (with confirmation)
- **Keyboard Shortcuts**: Enter to confirm rename, Escape to cancel

### 🔍 Search Functionality
- **Real-time Search**: Filter files as you type
- **Search Options**: Match case, whole word, regex support
- **Search Input**: Professional search input with icon

### 📋 Multiple Panels
- **Explorer Panel**: File tree and file operations
- **Search Panel**: File search and replace functionality
- **Source Control Panel**: Git integration (placeholder)
- **Extensions Panel**: Extension management (placeholder)

### ⚡ Advanced Features
- **Collapsible Sidebar**: Toggle sidebar visibility
- **Tab Navigation**: Switch between different panels
- **File Status**: Visual indicators for file changes
- **Empty State**: Professional empty state with call-to-action
- **Loading States**: Smooth loading animations

## Usage

### Basic Implementation

```tsx
import VSCodeSidebar from './VSCodeSidebar';

const MyComponent = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentFile, setCurrentFile] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);

  return (
    <VSCodeSidebar
      isVisible={showSidebar}
      onToggle={() => setShowSidebar(!showSidebar)}
      currentFile={currentFile}
      onFileSelect={(file) => setCurrentFile(file.path)}
      files={files}
      onNewFileClick={() => console.log('New file')}
      onNewFolderClick={() => console.log('New folder')}
      onOpenLocalFolder={() => console.log('Open folder')}
    />
  );
};
```

### Advanced Implementation with All Features

```tsx
import VSCodeSidebar from './VSCodeSidebar';

const MyComponent = () => {
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentFile, setCurrentFile] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);

  const handleDeleteFile = async (file: FileItem) => {
    // Implement file deletion logic
    console.log('Deleting file:', file);
  };

  const handleRenameFile = async (file: FileItem, newName: string) => {
    // Implement file rename logic
    console.log('Renaming file:', file, 'to:', newName);
  };

  const handleDuplicateFile = async (file: FileItem) => {
    // Implement file duplication logic
    console.log('Duplicating file:', file);
  };

  const handleDownloadFile = async (file: FileItem) => {
    // Implement file download logic
    console.log('Downloading file:', file);
  };

  return (
    <VSCodeSidebar
      isVisible={showSidebar}
      onToggle={() => setShowSidebar(!showSidebar)}
      currentFile={currentFile}
      onFileSelect={(file) => setCurrentFile(file.path)}
      files={files}
      onNewFileClick={() => console.log('New file')}
      onNewFolderClick={() => console.log('New folder')}
      onOpenLocalFolder={() => console.log('Open folder')}
      onDeleteFile={handleDeleteFile}
      onRenameFile={handleRenameFile}
      onDuplicateFile={handleDuplicateFile}
      onDownloadFile={handleDownloadFile}
      onToggleHiddenFiles={() => setShowHiddenFiles(!showHiddenFiles)}
      showHiddenFiles={showHiddenFiles}
    />
  );
};
```

## FileItem Interface

```typescript
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
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isVisible` | `boolean` | Yes | Controls sidebar visibility |
| `onToggle` | `() => void` | Yes | Callback when sidebar toggle is clicked |
| `currentFile` | `string` | No | Currently selected file path |
| `onFileSelect` | `(file: FileItem) => void` | No | Callback when a file is selected |
| `files` | `FileItem[]` | No | Array of files and folders to display |
| `onNewFileClick` | `() => void` | No | Callback for new file button |
| `onNewFolderClick` | `() => void` | No | Callback for new folder button |
| `onOpenLocalFolder` | `() => void` | No | Callback for open local folder button |
| `onDeleteFile` | `(file: FileItem) => void` | No | Callback for file deletion |
| `onRenameFile` | `(file: FileItem, newName: string) => void` | No | Callback for file renaming |
| `onDuplicateFile` | `(file: FileItem) => void` | No | Callback for file duplication |
| `onDownloadFile` | `(file: FileItem) => void` | No | Callback for file download |
| `onToggleHiddenFiles` | `() => void` | No | Callback for hidden files toggle |
| `showHiddenFiles` | `boolean` | No | Whether to show hidden files |

## File Types Supported

The component automatically detects file types and displays appropriate icons:

### Code Files
- JavaScript (`.js`, `.jsx`)
- TypeScript (`.ts`, `.tsx`)
- Python (`.py`)
- Java (`.java`)
- C++ (`.cpp`, `.c`)
- C# (`.cs`)
- Go (`.go`)
- Rust (`.rs`)
- PHP (`.php`)
- Ruby (`.rb`)

### Web Files
- HTML (`.html`)
- CSS (`.css`, `.scss`, `.sass`)
- JSON (`.json`)
- XML (`.xml`)
- YAML (`.yml`, `.yaml`)

### Media Files
- Images (`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`)

### Archive Files
- Archives (`.zip`, `.rar`, `.tar`, `.gz`)

### Database Files
- SQL (`.sql`)
- Database (`.db`)

### Configuration Files
- Environment (`.env`)
- Git (`.gitignore`)
- Lock files (`.lock`)
- Package files (`package.json`)

## Keyboard Shortcuts

- **Enter**: Confirm file rename
- **Escape**: Cancel file rename
- **Right-click**: Open context menu
- **Double-click**: Expand/collapse folders

## Styling

The component uses CSS custom properties for theming:

```css
:root {
  --vscode-bg: #1e1e1e;
  --vscode-sidebar-bg: #252526;
  --vscode-editor-bg: #1e1e1e;
  --vscode-header-bg: #2d2d30;
  --vscode-border: #3e3e42;
  --vscode-text: #cccccc;
  --vscode-text-light: #969696;
  --vscode-accent: #007acc;
  --vscode-success: #4caf50;
  --vscode-error: #f44336;
  --vscode-warning: #ffc107;
  --vscode-info: #2196f3;
}
```

## Dependencies

- **React**: ^19.1.0
- **Lucide React**: ^0.525.0 (for icons)
- **TypeScript**: ^4.9.5

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **High Contrast**: Support for high contrast mode
- **Focus Management**: Proper focus indicators
- **Color Blindness**: Color-safe status indicators

## Performance

- **Virtual Scrolling**: Efficient rendering for large file trees
- **Memoization**: Optimized re-renders
- **Lazy Loading**: Icons loaded on demand
- **Debounced Search**: Efficient search performance

## Contributing

When contributing to this component:

1. Follow the existing code style
2. Add TypeScript types for new features
3. Include accessibility considerations
4. Test on multiple browsers
5. Update this documentation

## License

This component is part of the collaborative coding platform and follows the same license terms.
