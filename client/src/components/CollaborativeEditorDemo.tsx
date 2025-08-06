import React from 'react';
import CollaborativeEditor from './CollaborativeEditor';

const CollaborativeEditorDemo: React.FC = () => {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <CollaborativeEditor
        roomId="demo-room-123"
        language="javascript"
        initialCode={`// Welcome to the VS Code-inspired Collaborative Editor!
// This editor has been redesigned to look and feel like VS Code

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Try these keyboard shortcuts:
// - Ctrl+Enter: Run the code
// - Ctrl+\`: Toggle terminal
// - Escape: Close terminal

console.log("Fibonacci sequence:");
for (let i = 0; i < 10; i++) {
    console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}
`}
      />
    </div>
  );
};

export default CollaborativeEditorDemo;