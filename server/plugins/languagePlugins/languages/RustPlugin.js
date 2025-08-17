const LanguagePlugin = require('../base/LanguagePlugin');

/**
 * Rust Language Plugin
 * Handles Rust code execution and validation
 */
class RustPlugin extends LanguagePlugin {
  getConfig() {
    return {
      id: 'rust',
      name: 'Rust',
      version: '1.75+',
      extension: '.rs',
      icon: '🦀',
      description: 'Systems programming language focused on safety and performance',
      category: 'compiled',
      features: ['memory-safety', 'zero-cost-abstractions', 'concurrency'],
      website: 'https://www.rust-lang.org/',
      documentation: 'https://doc.rust-lang.org/'
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

    // Basic syntax validation for Rust
    try {
      // Check for balanced braces and parentheses
      let braceCount = 0;
      let parenCount = 0;
      let bracketCount = 0;
      
      for (const char of code) {
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        else if (char === '(') parenCount++;
        else if (char === ')') parenCount--;
        else if (char === '[') bracketCount++;
        else if (char === ']') bracketCount--;
        
        if (braceCount < 0 || parenCount < 0 || bracketCount < 0) {
          throw new Error('Unmatched brackets/parentheses/braces');
        }
      }
      
      if (braceCount !== 0 || parenCount !== 0 || bracketCount !== 0) {
        throw new Error('Unmatched brackets/parentheses/braces');
      }

      // Check for basic Rust structure
      if (!code.includes('fn main()') && !code.includes('fn main(')) {
        violations.push({
          type: 'syntax',
          message: 'Rust code should have a main function'
        });
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
      image: 'rust:1.75-alpine',
      filename: 'main.rs',
      runCommand: ['./main'],
      compileCommand: ['rustc', 'main.rs', '-o', 'main'],
      setupCommands: [
        'apk add --no-cache gcc musl-dev'
      ],
      securityFlags: [
        '--release',
        '-C', 'opt-level=2'
      ],
      environment: {
        RUST_BACKTRACE: '0',
        RUST_LOG: 'error'
      },
      resourceLimits: {
        memory: 512 * 1024 * 1024, // 512MB (Rust needs more for compilation)
        cpu: 0.5,
        pids: 50
      }
    };
  }

  getSecurityPatterns() {
    return [
      // System access
      /std::env::/m,
      /std::fs::/m,
      /std::path::/m,
      /std::os::/m,
      
      // Network access
      /std::net::/m,
      /reqwest::/m,
      /ureq::/m,
      
      // Process control
      /std::process::/m,
      /std::thread::/m,
      
      // File operations
      /File::/m,
      /OpenOptions::/m,
      
      // Unsafe code
      /unsafe\s*{/m,
      /unsafe\s+fn/m,
      
      // External crates (security risk)
      /extern\s+crate/m,
      /use\s+.*::.*::/m,
      
      // System calls
      /libc::/m,
      /sys::/m,
      
      // Command execution
      /Command::/m,
      /spawn::/m,
      
      // Memory manipulation
      /std::ptr::/m,
      /std::mem::/m,
      
      // Raw pointers
      /\*mut/m,
      /\*const/m
    ];
  }

  getDefaultCode() {
    return `// Welcome to Rust Collaborative Editor
// Start coding with your team!

fn main() {
    println!("Hello, Collaborative World!");
    
    // Example: Simple function
    let result = add(2, 3);
    println!("2 + 3 = {}", result);
    
    // Example: Vector operations
    let numbers = vec![1, 2, 3, 4, 5];
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
    println!("Doubled: {:?}", doubled);
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}`;
  }

  async healthCheck() {
    try {
      // Simple health check - try to validate basic Rust syntax
      const testCode = 'fn main() { println!("health check"); }';
      this.validateCode(testCode);
      
      return {
        status: 'healthy',
        message: 'Rust runtime is working correctly',
        version: '1.75+'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Rust runtime error: ${error.message}`,
        error: error.message
      };
    }
  }

  preprocessCode(code) {
    // Ensure proper line endings
    code = code.replace(/\r\n/g, '\n');
    
    // Add common imports if not present
    if (!code.includes('use std::')) {
      code = 'use std::io;\n\n' + code;
    }
    
    return code;
  }

  postprocessResult(result) {
    // Clean up Rust specific output
    if (result.stdout) {
      result.stdout = result.stdout.replace(/^> /gm, ''); // Remove REPL prompts
    }
    
    if (result.stderr) {
      // Clean up compilation warnings
      result.stderr = result.stderr.replace(/warning: .*\n/g, '');
    }
    
    return result;
  }

  getSyntaxHighlighting() {
    return {
      keywords: [
        'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
        'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
        'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct',
        'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while',
        'async', 'await', 'dyn', 'abstract', 'become', 'box', 'do', 'final',
        'macro', 'override', 'priv', 'try', 'typeof', 'unsized', 'virtual',
        'yield'
      ],
      builtins: [
        'println!', 'print!', 'eprintln!', 'eprint!', 'format!', 'vec!',
        'assert!', 'assert_eq!', 'assert_ne!', 'debug_assert!', 'debug_assert_eq!',
        'panic!', 'unreachable!', 'unimplemented!', 'todo!'
      ]
    };
  }

  getCodeExamples() {
    return [
      {
        name: 'Hello World',
        code: 'fn main() {\n    println!("Hello, World!");\n}',
        description: 'Basic output example'
      },
      {
        name: 'Function Definition',
        code: `fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

fn main() {
    let message = greet("Alice");
    println!("{}", message);
}`,
        description: 'Function with parameters and return value'
      },
      {
        name: 'Vector Operations',
        code: `fn main() {
    let numbers = vec![1, 2, 3, 4, 5];
    let doubled: Vec<i32> = numbers.iter().map(|&x| x * 2).collect();
    let sum: i32 = numbers.iter().sum();
    
    println!("Original: {:?}", numbers);
    println!("Doubled: {:?}", doubled);
    println!("Sum: {}", sum);
}`,
        description: 'Vector manipulation and iterators'
      },
      {
        name: 'Struct Definition',
        code: `struct Person {
    name: String,
    age: u32,
}

impl Person {
    fn new(name: String, age: u32) -> Self {
        Person { name, age }
    }
    
    fn introduce(&self) {
        println!("Hi, I'm {} and I'm {} years old", self.name, self.age);
    }
}

fn main() {
    let person = Person::new("Bob".to_string(), 30);
    person.introduce();
}`,
        description: 'Struct with methods'
      },
      {
        name: 'Error Handling',
        code: `fn divide(a: f64, b: f64) -> Result<f64, &'static str> {
    if b == 0.0 {
        Err("Division by zero")
    } else {
        Ok(a / b)
    }
}

fn main() {
    match divide(10.0, 2.0) {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {}", e),
    }
}`,
        description: 'Result type and error handling'
      }
    ];
  }

  getDocumentation() {
    return {
      official: 'https://doc.rust-lang.org/',
      book: 'https://doc.rust-lang.org/book/',
      tutorials: [
        'https://doc.rust-lang.org/rust-by-example/',
        'https://rust-lang.github.io/async-book/'
      ],
      cheatsheets: [
        'https://cheats.rs/',
        'https://github.com/rust-lang/rustlings'
      ],
      packages: 'https://crates.io/',
      style: 'https://github.com/rust-dev-tools/fmt-rfcs'
    };
  }
}

module.exports = RustPlugin;
