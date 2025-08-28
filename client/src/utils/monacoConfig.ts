// Monaco Editor Configuration
// Language detection and default code templates

export function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: { [key: string]: string } = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'pyw': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'cc': 'cpp',
    'cxx': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'txt': 'text'
  };
  return languageMap[ext || ''] || 'text';
}

export function getFileExtension(language: string): string {
  const extensionMap: { [key: string]: string } = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'csharp': 'cs',
    'go': 'go',
    'rust': 'rs',
    'php': 'php',
    'ruby': 'rb',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'markdown': 'md',
    'text': 'txt'
  };
  return extensionMap[language] || 'txt';
}

export function getDefaultCode(language: string = 'javascript'): string {
  const defaultCodes: { [key: string]: string } = {
    javascript: `// JavaScript Code
console.log("Hello, World!");

// Your code here
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));`,

    typescript: `// TypeScript Code
console.log("Hello, World!");

// Your code here
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));`,

    python: `# Python Code
print("Hello, World!")

# Your code here
def greet(name):
    return f"Hello, {name}!"

print(greet("Developer"))`,

    java: `// Java Code
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        
        // Your code here
        String result = greet("Developer");
        System.out.println(result);
    }
    
    public static String greet(String name) {
        return "Hello, " + name + "!";
    }
}`,

    cpp: `// C++ Code
#include <iostream>
#include <string>

using namespace std;

// Your code here
string greet(string name) {
    return "Hello, " + name + "!";
}

int main() {
    cout << "Hello, World!" << endl;
    cout << greet("Developer") << endl;
    return 0;
}`,

    c: `// C Code
#include <stdio.h>
#include <string.h>

// Your code here
void greet(char* name) {
    printf("Hello, %s!\\n", name);
}

int main() {
    printf("Hello, World!\\n");
    greet("Developer");
    return 0;
}`,

    csharp: `// C# Code
using System;

class Program {
    static void Main(string[] args) {
        Console.WriteLine("Hello, World!");
        
        // Your code here
        string result = Greet("Developer");
        Console.WriteLine(result);
    }
    
    static string Greet(string name) {
        return $"Hello, {name}!";
    }
}`,

    go: `// Go Code
package main

import "fmt"

// Your code here
func greet(name string) string {
    return fmt.Sprintf("Hello, %s!", name)
}

func main() {
    fmt.Println("Hello, World!")
    fmt.Println(greet("Developer"))
}`,

    rust: `// Rust Code
fn main() {
    println!("Hello, World!");
    
    // Your code here
    let result = greet("Developer");
    println!("{}", result);
}

fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}`,

    php: `<?php
// PHP Code
echo "Hello, World!\\n";

// Your code here
function greet($name) {
    return "Hello, " . $name . "!";
}

echo greet("Developer") . "\\n";
?>`,

    ruby: `# Ruby Code
puts "Hello, World!"

# Your code here
def greet(name)
  "Hello, #{name}!"
end

puts greet("Developer")`,

    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>Welcome to your HTML page.</p>
    
    <script>
        // Your JavaScript code here
        console.log("Hello from JavaScript!");
    </script>
</body>
</html>`,

    css: `/* CSS Styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
    color: #333;
    text-align: center;
}

p {
    color: #666;
    line-height: 1.6;
}`,

    json: `{
  "message": "Hello, World!",
  "data": {
    "name": "Developer",
    "greeting": "Welcome to JSON!"
  },
  "items": [
    "item1",
    "item2",
    "item3"
  ]
}`,

    markdown: `# Hello, World!

Welcome to your Markdown document.

## Features

- **Bold text**
- *Italic text*
- \`Code snippets\`

## Code Example

\`\`\`javascript
console.log("Hello from Markdown!");
\`\`\`

## Lists

1. First item
2. Second item
3. Third item

- Unordered list
- Another item

> This is a blockquote

---

*Created with Markdown*`,

    text: `Hello, World!

Welcome to your text file.

This is a plain text document where you can write:
- Notes
- Documentation
- Instructions
- Any text content

Feel free to edit this file as needed.`
  };

  return defaultCodes[language] || defaultCodes.javascript;
}
