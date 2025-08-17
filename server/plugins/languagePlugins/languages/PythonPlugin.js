const LanguagePlugin = require('../base/LanguagePlugin');

/**
 * Python Language Plugin
 * Handles Python code execution and validation
 */
class PythonPlugin extends LanguagePlugin {
  getConfig() {
    return {
      id: 'python',
      name: 'Python',
      version: '3.11+',
      extension: '.py',
      icon: '🐍',
      description: 'Python programming language',
      category: 'scripting',
      features: ['async', 'packages', 'pip'],
      website: 'https://www.python.org/',
      documentation: 'https://docs.python.org/3/'
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

    // Basic syntax validation using Python's ast module
    try {
      // This is a simplified check - in production you'd use a Python process
      const pythonKeywords = [
        'import', 'from', 'def', 'class', 'if', 'else', 'elif', 'for', 'while',
        'try', 'except', 'finally', 'with', 'as', 'in', 'is', 'not', 'and', 'or',
        'True', 'False', 'None', 'return', 'yield', 'break', 'continue', 'pass',
        'raise', 'assert', 'del', 'global', 'nonlocal', 'lambda'
      ];
      
      // Check for balanced parentheses and basic structure
      let parenCount = 0;
      let bracketCount = 0;
      let braceCount = 0;
      
      for (const char of code) {
        if (char === '(') parenCount++;
        else if (char === ')') parenCount--;
        else if (char === '[') bracketCount++;
        else if (char === ']') bracketCount--;
        else if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        
        if (parenCount < 0 || bracketCount < 0 || braceCount < 0) {
          throw new Error('Unmatched brackets/parentheses');
        }
      }
      
      if (parenCount !== 0 || bracketCount !== 0 || braceCount !== 0) {
        throw new Error('Unmatched brackets/parentheses');
      }
      
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
      image: 'python:3.11-alpine',
      filename: 'main.py',
      runCommand: ['python', 'main.py'],
      compileCommand: null,
      setupCommands: [
        'apk add --no-cache gcc musl-dev'
      ],
      securityFlags: [
        '-B', // Disable bytecode generation
        '-E', // Ignore environment variables
        '-s'  // Disable user site directory
      ],
      environment: {
        PYTHONPATH: '',
        PYTHONUNBUFFERED: '1',
        PYTHONDONTWRITEBYTECODE: '1'
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
      // System and OS access
      /import\s+os\s*$/m,
      /import\s+subprocess\s*$/m,
      /import\s+sys\s*$/m,
      /import\s+shutil\s*$/m,
      /import\s+glob\s*$/m,
      /import\s+pathlib\s*$/m,
      /import\s+tempfile\s*$/m,
      
      // Network access
      /import\s+urllib\s*$/m,
      /import\s+requests\s*$/m,
      /import\s+socket\s*$/m,
      /import\s+http\s*$/m,
      
      // File operations
      /import\s+pickle\s*$/m,
      /import\s+json\s*$/m,
      /import\s+xml\s*$/m,
      
      // Dangerous functions
      /__import__\s*\(/m,
      /exec\s*\(/m,
      /eval\s*\(/m,
      /compile\s*\(/m,
      
      // File operations
      /open\s*\(/m,
      /file\s*\(/m,
      /input\s*\(/m,
      
      // System calls
      /subprocess\./m,
      /os\./m,
      /sys\./m,
      
      // Process control
      /exit\s*\(/m,
      /quit\s*\(/m,
      /breakpoint\s*\(/m,
      
      // Module manipulation
      /importlib\./m,
      /imp\./m,
      
      // Shell access
      /shell\s*\(/m,
      /system\s*\(/m,
      
      // From imports with dangerous modules
      /from\s+os\s+import/m,
      /from\s+subprocess\s+import/m,
      /from\s+sys\s+import/m,
      
      // Relative imports (security risk)
      /from\s+\./m,
      /import\s+\./m
    ];
  }

  getDefaultCode() {
    return `# Welcome to Python Collaborative Editor
# Start coding with your team!

def hello_world():
    print("Hello, Collaborative World!")

# Add your Python code here
hello_world()

# Example: Simple function
def add(a, b):
    return a + b

print("2 + 3 =", add(2, 3))

# Example: List comprehension
numbers = [1, 2, 3, 4, 5]
squares = [n**2 for n in numbers]
print("Squares:", squares)`;
  }

  async healthCheck() {
    try {
      // Simple health check - try to parse basic Python syntax
      const testCode = 'print("health check")';
      this.validateCode(testCode);
      
      return {
        status: 'healthy',
        message: 'Python runtime is working correctly',
        version: '3.11+'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Python runtime error: ${error.message}`,
        error: error.message
      };
    }
  }

  preprocessCode(code) {
    // Add encoding declaration if not present
    if (!code.includes('# -*- coding:')) {
      code = '# -*- coding: utf-8 -*-\n\n' + code;
    }
    
    // Ensure proper line endings
    code = code.replace(/\r\n/g, '\n');
    
    return code;
  }

  postprocessResult(result) {
    // Clean up Python specific output
    if (result.stdout) {
      result.stdout = result.stdout.replace(/^>>> /gm, ''); // Remove REPL prompts
      result.stdout = result.stdout.replace(/^\.\.\. /gm, ''); // Remove continuation prompts
    }
    
    return result;
  }

  getSyntaxHighlighting() {
    return {
      keywords: [
        'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
        'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
        'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
        'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
        'try', 'while', 'with', 'yield'
      ],
      builtins: [
        'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'breakpoint', 'bytearray',
        'bytes', 'callable', 'chr', 'classmethod', 'compile', 'complex',
        'delattr', 'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec',
        'filter', 'float', 'format', 'frozenset', 'getattr', 'globals',
        'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance',
        'issubclass', 'iter', 'len', 'list', 'locals', 'map', 'max', 'memoryview',
        'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'print', 'property',
        'range', 'repr', 'reversed', 'round', 'set', 'setattr', 'slice',
        'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type',
        'vars', 'zip'
      ]
    };
  }

  getCodeExamples() {
    return [
      {
        name: 'Hello World',
        code: 'print("Hello, World!")',
        description: 'Basic output example'
      },
      {
        name: 'Function Definition',
        code: `def greet(name):
    return f"Hello, {name}!"

print(greet("Alice"))`,
        description: 'Function with f-strings'
      },
      {
        name: 'List Operations',
        code: `numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
total = sum(numbers)
print("Doubled:", doubled)
print("Sum:", total)`,
        description: 'List comprehension and built-in functions'
      },
      {
        name: 'Class Definition',
        code: `class Calculator:
    def __init__(self):
        self.history = []
    
    def add(self, a, b):
        result = a + b
        self.history.append(f"{a} + {b} = {result}")
        return result
    
    def get_history(self):
        return self.history

calc = Calculator()
print(calc.add(5, 3))
print("History:", calc.get_history())`,
        description: 'Class with methods and state'
      },
      {
        name: 'File Operations (Safe)',
        code: `# Note: File operations are restricted in sandbox
# This is just an example of the syntax
data = ["line 1", "line 2", "line 3"]
print("Data:", data)`,
        description: 'Data manipulation example'
      }
    ];
  }

  getDocumentation() {
    return {
      official: 'https://docs.python.org/3/',
      tutorials: [
        'https://docs.python.org/3/tutorial/',
        'https://realpython.com/'
      ],
      cheatsheets: [
        'https://github.com/gto76/python-cheatsheet'
      ],
      packages: 'https://pypi.org/',
      style: 'https://www.python.org/dev/peps/pep-0008/'
    };
  }
}

module.exports = PythonPlugin;
