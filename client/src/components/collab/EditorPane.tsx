import React from 'react';
import Editor from '@monaco-editor/react';

interface EditorPaneProps {
  showSidebar: boolean;
  currentFile: string;
  language: string;
  code: string;
  activeFileContent: string | undefined;
  onMount: (editor: any, monaco: any) => void;
  theme: 'vs-dark' | 'vs-light';
}

const EditorPane: React.FC<EditorPaneProps> = ({ showSidebar, currentFile, language, code, activeFileContent, onMount, theme }) => {
  return (
    <div className={`vscode-editor-container ${showSidebar ? 'with-sidebar' : ''}`}>
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={code}
        theme={theme}
        onMount={onMount}
        value={activeFileContent ?? code}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          roundedSelection: false,
          readOnly: false,
          cursorStyle: 'line',
          contextmenu: true,
          mouseWheelZoom: true,
          quickSuggestions: true,
          renderWhitespace: 'selection',
          tabSize: 2,
          insertSpaces: true,
          folding: true,
          lineNumbers: 'on',
          glyphMargin: true,
          foldingStrategy: 'auto',
          showFoldingControls: 'mouseover',
          disableLayerHinting: true,
          renderLineHighlight: 'all',
          selectOnLineNumbers: true,
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true
          },
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalScrollbarSize: 14,
            horizontalScrollbarSize: 14
          }
        }}
      />
    </div>
  );
};

export default EditorPane;


