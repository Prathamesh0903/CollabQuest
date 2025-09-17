#!/usr/bin/env node

/**
 * Script to fix hardcoded localhost:5001 URLs in client code
 * This script replaces hardcoded URLs with environment variable references
 */

const fs = require('fs');
const path = require('path');

const clientSrcPath = path.join(__dirname, 'client', 'src');

// Files to update with their specific patterns
const fileUpdates = [
  {
    file: 'components/CollaborativeEditor.tsx',
    patterns: [
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/files\/session\//g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/files/session/'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/files\/session\/\$\{currentSessionId\}\/folder`/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/files/session/${currentSessionId}/folder`'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/files\/session\/\$\{currentSessionId\}\/file\/\$\{file\.path\}`/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/files/session/${currentSessionId}/file/${file.path}`'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/files\/session\/\$\{currentSessionId\}\/file\/\$\{currentFile\}`/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/files/session/${currentSessionId}/file/${currentFile}`'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/files\/session\/\$\{currentSessionId\}\/import-files`/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/files/session/${currentSessionId}/import-files`'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/files\/session\/\$\{currentSessionId\}\/file\/\$\{file\.path\}\/rename`/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/files/session/${currentSessionId}/file/${file.path}/rename`'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/files\/session\/\$\{currentSessionId\}\/file\/\$\{file\.path\}\/duplicate`/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/files/session/${currentSessionId}/file/${file.path}/duplicate`'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/files\/session\/\$\{currentSessionId\}\/import-local`/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/files/session/${currentSessionId}/import-local`'
      }
    ]
  },
  {
    file: 'components/CodeExecutionExample.tsx',
    patterns: [
      {
        from: /fetch\('http:\/\/localhost:5001\/api\/execute'/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute`'
      },
      {
        from: /fetch\('http:\/\/localhost:5001\/api\/execute\/secure'/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute/secure`'
      }
    ]
  },
  {
    file: 'components/EnhancedCodeExecution.tsx',
    patterns: [
      {
        from: /fetch\('http:\/\/localhost:5001\/api\/execute'/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute`'
      },
      {
        from: /fetch\('http:\/\/localhost:5001\/api\/execute\/with-files'/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute/with-files`'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/execute\/files\/\$\{sessionId\}`\)/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute/files/${sessionId}`)'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/execute\/files\/\$\{sessionId\}\/\$\{filename\}`\)/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute/files/${sessionId}/${filename}`)'
      },
      {
        from: /fetch\('http:\/\/localhost:5001\/api\/execute\/interactive'/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute/interactive`'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/execute\/interactive\/\$\{interactiveSession\.sessionId\}\/input`/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute/interactive/${interactiveSession.sessionId}/input`'
      },
      {
        from: /fetch\(`http:\/\/localhost:5001\/api\/execute\/interactive\/\$\{interactiveSession\.sessionId\}`/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute/interactive/${interactiveSession.sessionId}`'
      }
    ]
  },
  {
    file: 'utils/codeExecutionExample.js',
    patterns: [
      {
        from: /fetch\('http:\/\/localhost:5001\/api\/execute'/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute`'
      },
      {
        from: /fetch\('http:\/\/localhost:5001\/api\/execute\/secure'/g,
        to: 'fetch(`${process.env.REACT_APP_API_URL || \'http://localhost:5001\'}/api/execute/secure`'
      }
    ]
  }
];

// Update files
fileUpdates.forEach(({ file, patterns }) => {
  const filePath = path.join(clientSrcPath, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    patterns.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${file}`);
    } else {
      console.log(`⏭️  No changes needed for ${file}`);
    }
  } else {
    console.log(`❌ File not found: ${file}`);
  }
});

// Fix remaining socket connections
const socketFiles = [
  'components/Battle/BattleConfigModal.tsx',
  'components/Battle/BattleLobby.tsx', 
  'components/Battle/PermissionManager.tsx'
];

socketFiles.forEach(file => {
  const filePath = path.join(clientSrcPath, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes("process.env.REACT_APP_SERVER_URL")) {
      content = content.replace(/process\.env\.REACT_APP_SERVER_URL/g, 'process.env.REACT_APP_SOCKET_URL');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated socket URL in ${file}`);
    }
  }
});

console.log('\n🎉 Hardcoded URL fixes completed!');
console.log('\n📝 Next steps:');
console.log('1. Commit and push these changes');
console.log('2. Redeploy to Vercel');
console.log('3. Test your application');
