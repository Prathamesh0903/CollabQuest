# Language Plugin System

A modular, extensible plugin architecture for adding new programming languages to the collaborative coding platform.

## 🎯 Overview

The Language Plugin System provides a clean, maintainable way to add support for new programming languages without modifying core application code. Each language is implemented as a separate plugin that follows a standardized interface.

## 🏗️ Architecture

```
server/plugins/languagePlugins/
├── index.js                 # Plugin registry (auto-loads plugins)
├── PluginManager.js         # Main integration layer
├── base/
│   └── LanguagePlugin.js    # Abstract base class
├── languages/
│   ├── JavaScriptPlugin.js  # JavaScript implementation
│   ├── PythonPlugin.js      # Python implementation
│   └── ...                  # More language plugins
└── README.md               # This file
```

## 🚀 Quick Start

### 1. Initialize the Plugin System

```javascript
const pluginManager = require('./server/plugins/languagePlugins/PluginManager');

// Initialize (auto-loads all plugins)
await pluginManager.initialize();

// Execute code
const result = await pluginManager.executeCode('javascript', 'console.log("Hello")');
```

### 2. Add a New Language Plugin

Create a new file in `server/plugins/languagePlugins/languages/YourLanguagePlugin.js`:

```javascript
const LanguagePlugin = require('../base/LanguagePlugin');

class YourLanguagePlugin extends LanguagePlugin {
  getConfig() {
    return {
      id: 'yourlanguage',
      name: 'Your Language',
      version: '1.0.0',
      extension: '.yl',
      icon: '🚀',
      description: 'Your awesome programming language',
      category: 'scripting',
      features: ['async', 'packages'],
      website: 'https://yourlanguage.org/',
      documentation: 'https://docs.yourlanguage.org/'
    };
  }

  validateCode(code, options = {}) {
    // Implement validation logic
    return { isValid: true, violations: [], warnings: [] };
  }

  getDockerConfig() {
    return {
      image: 'yourlanguage:latest',
      filename: 'main.yl',
      runCommand: ['yourlang', 'main.yl'],
      compileCommand: null,
      // ... other Docker settings
    };
  }

  getSecurityPatterns() {
    return [
      // Add security patterns
    ];
  }

  getDefaultCode() {
    return `// Welcome to Your Language
// Start coding here!`;
  }
}

module.exports = YourLanguagePlugin;
```

The plugin will be automatically loaded when the system starts!

## 📋 Plugin Interface

### Required Methods

Every language plugin must implement these methods:

#### `getConfig()`
Returns language configuration:
```javascript
{
  id: 'language-id',           // Unique identifier
  name: 'Language Name',       // Display name
  version: '1.0.0',           // Version string
  extension: '.ext',          // File extension
  icon: '🚀',                 // Emoji icon
  description: 'Description',  // Language description
  category: 'scripting',      // Category (scripting, compiled, etc.)
  features: ['async'],        // Supported features
  website: 'https://...',     // Official website
  documentation: 'https://...' // Documentation URL
}
```

#### `validateCode(code, options)`
Validates code for security and syntax:
```javascript
{
  isValid: boolean,
  violations: [
    {
      type: 'security' | 'syntax' | 'length',
      pattern: string,
      message: string
    }
  ],
  warnings: []
}
```

#### `getDockerConfig()`
Returns Docker execution configuration:
```javascript
{
  image: 'docker-image:tag',
  filename: 'main.ext',
  runCommand: ['command', 'args'],
  compileCommand: ['compile', 'command'] | null,
  setupCommands: ['setup', 'commands'],
  securityFlags: ['security', 'flags'],
  environment: { ENV_VAR: 'value' },
  resourceLimits: {
    memory: 256 * 1024 * 1024,
    cpu: 0.5,
    pids: 50
  }
}
```

#### `getSecurityPatterns()`
Returns array of forbidden regex patterns:
```javascript
[
  /dangerous_pattern/m,
  /another_pattern/m
]
```

#### `getDefaultCode()`
Returns default code template for the language.

### Optional Methods

#### `healthCheck()`
Returns health status of the language runtime:
```javascript
{
  status: 'healthy' | 'unhealthy' | 'unknown',
  message: string,
  version?: string,
  error?: string
}
```

#### `preprocessCode(code)`
Pre-processes code before execution (e.g., add strict mode).

#### `postprocessResult(result)`
Post-processes execution results (e.g., clean up output).

#### `getSyntaxHighlighting()`
Returns syntax highlighting configuration.

#### `getCodeExamples()`
Returns array of code examples:
```javascript
[
  {
    name: 'Example Name',
    code: 'example code',
    description: 'Description'
  }
]
```

#### `getDocumentation()`
Returns documentation links:
```javascript
{
  official: 'https://...',
  tutorials: ['https://...'],
  cheatsheets: ['https://...']
}
```

## 🔧 Integration with Existing System

### Update Code Execution Routes

Replace hardcoded language handling with plugin system:

```javascript
// Before (hardcoded)
const supportedLanguages = ['javascript', 'python', 'java'];

// After (plugin-based)
const pluginManager = require('../plugins/languagePlugins/PluginManager');
const supportedLanguages = pluginManager.getSupportedLanguages().map(l => l.id);
```

### Update Docker Executor

Modify `server/utils/dockerExecutor.js` to use plugin configurations:

```javascript
const pluginManager = require('../plugins/languagePlugins/PluginManager');

// Instead of hardcoded configs
getLanguageConfig(language) {
  return pluginManager.getLanguageConfig(language).getDockerConfig();
}
```

### Update Frontend Components

Update `LanguageSwitcher` component to use plugin data:

```javascript
// Fetch languages from API
const [languages, setLanguages] = useState([]);

useEffect(() => {
  fetch('/api/execute/languages')
    .then(res => res.json())
    .then(data => setLanguages(data.languages));
}, []);
```

## 🛡️ Security Features

### Built-in Security

- **Pattern-based validation**: Each plugin defines forbidden patterns
- **Resource limits**: Docker containers with memory/CPU limits
- **Network isolation**: Containers run without network access
- **File system restrictions**: Read-only filesystems
- **Process limits**: Maximum number of processes per container

### Custom Security Rules

Add language-specific security patterns:

```javascript
getSecurityPatterns() {
  return [
    // System access
    /import\s+os/m,
    /require\s*\(\s*['"]fs['"]\s*\)/m,
    
    // Dangerous functions
    /eval\s*\(/m,
    /exec\s*\(/m,
    
    // Network access
    /import\s+urllib/m,
    /require\s*\(\s*['"]http['"]\s*\)/m
  ];
}
```

## 📊 Plugin Management

### List All Plugins

```javascript
const plugins = pluginManager.getSupportedLanguages();
console.log('Available languages:', plugins.map(p => p.name));
```

### Check Plugin Health

```javascript
const health = await pluginManager.getHealthStatus();
console.log('Plugin health:', health);
```

### Get Plugin Statistics

```javascript
const stats = pluginManager.getStats();
console.log('Plugin stats:', stats);
```

### Register Custom Plugin

```javascript
const MyCustomPlugin = require('./MyCustomPlugin');
pluginManager.registerPlugin('custom', new MyCustomPlugin());
```

## 🧪 Testing

### Test Plugin Interface

```javascript
const plugin = new YourLanguagePlugin();

// Test required methods
console.assert(typeof plugin.getConfig === 'function');
console.assert(typeof plugin.validateCode === 'function');
console.assert(typeof plugin.getDockerConfig === 'function');

// Test validation
const result = plugin.validateCode('valid code');
console.assert(result.isValid === true);
```

### Test Code Execution

```javascript
const result = await pluginManager.executeCode('yourlanguage', 'print("test")');
console.assert(result.success === true);
```

## 🚀 Adding New Languages

### Step 1: Create Plugin File

Create `server/plugins/languagePlugins/languages/NewLanguagePlugin.js`

### Step 2: Implement Required Methods

Follow the interface specification above.

### Step 3: Test the Plugin

```javascript
// Test locally
const plugin = new NewLanguagePlugin();
const config = plugin.getConfig();
console.log('Plugin config:', config);
```

### Step 4: Restart Server

The plugin will be auto-loaded on server restart.

### Step 5: Update Frontend (Optional)

Add the new language to frontend components if needed.

## 📝 Best Practices

### 1. Security First
- Always implement comprehensive security patterns
- Test with malicious code examples
- Use Docker containers for isolation

### 2. Error Handling
- Provide clear error messages
- Handle edge cases gracefully
- Log errors for debugging

### 3. Performance
- Keep validation fast
- Use efficient regex patterns
- Minimize Docker image size

### 4. Documentation
- Document language-specific features
- Provide code examples
- Include troubleshooting guides

### 5. Testing
- Test with various code samples
- Test error conditions
- Test security patterns

## 🔍 Troubleshooting

### Plugin Not Loading
- Check file naming convention
- Verify plugin extends `LanguagePlugin`
- Check console for error messages

### Code Execution Fails
- Verify Docker image exists
- Check Docker configuration
- Review security patterns

### Validation Issues
- Test regex patterns separately
- Check for false positives
- Review language syntax

## 📚 Examples

See the existing plugins for complete examples:
- `JavaScriptPlugin.js` - JavaScript/Node.js support
- `PythonPlugin.js` - Python support

## 🤝 Contributing

1. Create a new plugin file
2. Implement the required interface
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## 📄 License

This plugin system is part of the collaborative coding platform.
