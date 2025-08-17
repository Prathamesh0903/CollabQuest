const LanguagePlugin = require('../base/LanguagePlugin');

/**
 * JavaScript Language Plugin
 * Handles JavaScript/Node.js code execution and validation
 */
class JavaScriptPlugin extends LanguagePlugin {
  getConfig() {
    return {
      id: 'javascript',
      name: 'JavaScript',
      version: 'Node.js 18+',
      extension: '.js',
      icon: '📄',
      description: 'JavaScript runtime with Node.js',
      category: 'scripting',
      features: ['async', 'modules', 'npm'],
      website: 'https://nodejs.org/',
      documentation: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'
    };
  }

  validateCode(code, options = {}) {
    const patterns = this.getSecurityPatterns();
    const violations = [];

    // Check for forbidden patterns
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        violations.push({
          type: 'security',
          pattern: pattern.source,
          message: `Forbidden pattern detected: ${pattern.source}`
        });
      }
    }

    // Check code length
    if (code.length > (options.maxLength || 50000)) {
      violations.push({
        type: 'length',
        message: `Code too long (${code.length} chars, max ${options.maxLength || 50000})`
      });
    }

    // Basic syntax validation
    try {
      // Use Node.js built-in parser for basic syntax check
      require('vm').createScript(code);
    } catch (error) {
      violations.push({
        type: 'syntax',
        message: `Syntax error: ${error.message}`
      });
    }

    return {
      isValid: violations.length === 0,
      violations,
      warnings: []
    };
  }

  getDockerConfig() {
    return {
      image: 'node:18-alpine',
      filename: 'main.js',
      runCommand: ['node', 'main.js'],
      compileCommand: null,
      setupCommands: [
        'apk add --no-cache python3 py3-pip'
      ],
      securityFlags: [
        '--max-old-space-size=128',
        '--no-warnings',
        '--no-deprecation'
      ],
      environment: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=128'
      },
      resourceLimits: {
        memory: 256 * 1024 * 1024, // 256MB
        cpu: 0.5, // 50% CPU
        pids: 50
      }
    };
  }

  getSecurityPatterns() {
    return [
      // File system access
      /require\s*\(\s*['"]fs['"]\s*\)/m,
      /require\s*\(\s*['"]path['"]\s*\)/m,
      /require\s*\(\s*['"]os['"]\s*\)/m,
      
      // Process and system access
      /require\s*\(\s*['"]child_process['"]\s*\)/m,
      /require\s*\(\s*['"]process['"]\s*\)/m,
      /require\s*\(\s*['"]cluster['"]\s*\)/m,
      
      // Network access
      /require\s*\(\s*['"]http['"]\s*\)/m,
      /require\s*\(\s*['"]https['"]\s*\)/m,
      /require\s*\(\s*['"]net['"]\s*\)/m,
      
      // Dangerous functions
      /eval\s*\(/m,
      /Function\s*\(/m,
      /setTimeout\s*\(/m,
      /setInterval\s*\(/m,
      /setImmediate\s*\(/m,
      
      // Process control
      /process\.exit/m,
      /process\.kill/m,
      /process\.env/m,
      
      // Global objects
      /__dirname/m,
      /__filename/m,
      /global\./m,
      
      // Buffer manipulation
      /Buffer\./m,
      /new\s+Buffer/m,
      
      // Module loading
      /require\s*\(\s*['"]\.\./m, // Relative paths
      /import\s+.*\s+from\s+['"]\.\./m, // ES6 relative imports
      
      // Shell commands
      /`.*\$\(.*`/m, // Template literals with subshells
      /exec\s*\(/m,
      /spawn\s*\(/m
    ];
  }

  getDefaultCode() {
    return `// Welcome to JavaScript Collaborative Editor
// Start coding with your team!

function helloWorld() {
    console.log("Hello, Collaborative World!");
}

// Add your JavaScript code here
helloWorld();

// Example: Simple function
function add(a, b) {
    return a + b;
}

console.log("2 + 3 =", add(2, 3));`;
  }

  async healthCheck() {
    try {
      // Simple health check - try to create a basic Node.js script
      const testCode = 'console.log("health check");';
      require('vm').createScript(testCode);
      
      return {
        status: 'healthy',
        message: 'JavaScript runtime is working correctly',
        version: process.version
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `JavaScript runtime error: ${error.message}`,
        error: error.message
      };
    }
  }

  preprocessCode(code) {
    // Add strict mode if not present
    if (!code.includes('"use strict"') && !code.includes("'use strict'")) {
      code = '"use strict";\n\n' + code;
    }
    
    return code;
  }

  postprocessResult(result) {
    // Clean up Node.js specific output
    if (result.stdout) {
      result.stdout = result.stdout.replace(/^> /gm, ''); // Remove REPL prompts
    }
    
    return result;
  }

  getSyntaxHighlighting() {
    return {
      keywords: [
        'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
        'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
        'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new',
        'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
        'var', 'void', 'while', 'with', 'yield', 'async', 'await'
      ],
      builtins: [
        'console', 'Math', 'Date', 'Array', 'Object', 'String', 'Number',
        'Boolean', 'RegExp', 'JSON', 'Promise', 'Map', 'Set', 'WeakMap',
        'WeakSet', 'Symbol', 'Proxy', 'Reflect', 'Intl'
      ]
    };
  }

  getCodeExamples() {
    return [
      {
        name: 'Hello World',
        code: 'console.log("Hello, World!");',
        description: 'Basic output example'
      },
      {
        name: 'Function Definition',
        code: `function greet(name) {
    return \`Hello, \${name}!\`;
}
console.log(greet("Alice"));`,
        description: 'Function with template literals'
      },
      {
        name: 'Array Operations',
        code: `const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = numbers.reduce((a, b) => a + b, 0);
console.log("Doubled:", doubled);
console.log("Sum:", sum);`,
        description: 'Array methods and arrow functions'
      },
      {
        name: 'Async/Await',
        code: `async function fetchData() {
    return new Promise(resolve => {
        setTimeout(() => resolve("Data loaded!"), 1000);
    });
}

async function main() {
    const result = await fetchData();
    console.log(result);
}

main();`,
        description: 'Asynchronous programming example'
      }
    ];
  }

  getDocumentation() {
    return {
      official: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      nodejs: 'https://nodejs.org/api/',
      tutorials: [
        'https://javascript.info/',
        'https://eloquentjavascript.net/'
      ],
      cheatsheets: [
        'https://github.com/mbeaudru/modern-js-cheatsheet'
      ]
    };
  }
}

module.exports = JavaScriptPlugin;
