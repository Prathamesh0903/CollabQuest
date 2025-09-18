import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';

interface CodeEditorProps {
  initialCode?: string;
  onChange?: (code: string) => void;
  onSubmit?: (code: string) => void;
  language?: string;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = '',
  onChange,
  onSubmit,
  language = 'javascript',
  readOnly = false
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: initialCode,
        language,
        theme: 'vs-dark',
        automaticLayout: true,
        readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        fontSize: 14,
        tabSize: 2,
      });

      editorRef.current.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => {
          if (onSubmit && editorRef.current) {
            onSubmit(editorRef.current.getValue());
          }
        }
      );

      editorRef.current.onDidChangeModelContent(() => {
        if (onChange && editorRef.current) {
          onChange(editorRef.current.getValue());
        }
      });
    }

    return () => {
      editorRef.current?.dispose();
    };
  }, [initialCode, onChange, onSubmit, language, readOnly]);

  return (
    <div 
      ref={containerRef} 
      className="code-editor"
      style={{ width: '100%', height: '100%' }}
    />
  );
};


