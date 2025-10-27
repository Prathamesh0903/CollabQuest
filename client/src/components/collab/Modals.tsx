import React from 'react';

interface NewFileModalProps {
  visible: boolean;
  newFileName: string;
  newFileLanguage: string;
  onChangeName: (v: string) => void;
  onChangeLanguage: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const NewFileModal: React.FC<NewFileModalProps> = ({ visible, newFileName, newFileLanguage, onChangeName, onChangeLanguage, onSave, onClose }) => (
  <div className={`modal-overlay ${visible ? 'active' : ''}`}>
    <div className="modal-content">
      <h2>New File</h2>
      <input
        type="text"
        placeholder="File name (e.g., main.js)"
        value={newFileName}
        onChange={(e) => onChangeName(e.target.value)}
        onKeyPress={(e) => { if (e.key === 'Enter') onSave(); }}
      />
      <select value={newFileLanguage} onChange={(e) => onChangeLanguage(e.target.value)}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="java">Java</option>
        <option value="cpp">C++</option>
        <option value="csharp">C#</option>
        <option value="typescript">TypeScript</option>
        <option value="go">Go</option>
        <option value="rust">Rust</option>
        <option value="php">PHP</option>
        <option value="ruby">Ruby</option>
      </select>
      <button onClick={onSave}>Create File</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  </div>
);

interface NewFolderModalProps {
  visible: boolean;
  newFolderName: string;
  onChangeName: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({ visible, newFolderName, onChangeName, onSave, onClose }) => (
  <div className={`modal-overlay ${visible ? 'active' : ''}`}>
    <div className="modal-content">
      <h2>New Folder</h2>
      <input
        type="text"
        placeholder="Folder name"
        value={newFolderName}
        onChange={(e) => onChangeName(e.target.value)}
        onKeyPress={(e) => { if (e.key === 'Enter') onSave(); }}
      />
      <button onClick={onSave}>Create Folder</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  </div>
);

interface LocalFolderModalProps {
  visible: boolean;
  localFolderPath: string;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
}

export const LocalFolderModal: React.FC<LocalFolderModalProps> = ({ visible, localFolderPath, onFileInputChange, onClose }) => (
  <div className={`modal-overlay ${visible ? 'active' : ''}`}>
    <div className="modal-content">
      <h2>Open Local Folder</h2>
      <p style={{ marginBottom: '16px', color: 'var(--vscode-text-light)', fontSize: '14px' }}>
        Select a folder or files to import into this session.
      </p>

      <div className="file-picker-container">
        <label htmlFor="folder-picker" className="file-picker-label">
          <div className="file-picker-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>📁 Select a folder (includes all files)</span>
          </div>
        </label>
        <input id="folder-picker" type="file" webkitdirectory={true as any} multiple onChange={onFileInputChange} style={{ display: 'none' }} />

        <div className="file-picker-options">
          <label htmlFor="single-file-picker" className="file-picker-option">
            <input id="single-file-picker" type="file" multiple onChange={onFileInputChange} style={{ display: 'none' }} />
            <span>📄 Select individual files</span>
          </label>
        </div>
      </div>

      {localFolderPath && (
        <div className="selected-path">
          <strong>Selected:</strong> {localFolderPath}
        </div>
      )}

      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  </div>
);



