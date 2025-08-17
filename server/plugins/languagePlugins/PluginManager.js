const registry = require('./index');
const path = require('path');

/**
 * Plugin Manager
 * Integrates language plugins with the existing code execution system
 */
class PluginManager {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the plugin system
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Auto-load all plugins
      await registry.autoLoadPlugins();
      
      console.log('🎯 Plugin system initialized successfully');
      console.log(`📦 Loaded ${registry.getSupportedLanguages().length} language plugins`);
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize plugin system:', error);
      throw error;
    }
  }

  /**
   * Execute code using the appropriate language plugin
   * @param {string} language - Language identifier
   * @param {string} code - Source code
   * @param {string} input - Input data
   * @param {Object} options - Execution options
   */
  async executeCode(language, code, input = '', options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!registry.isSupported(language)) {
      throw new Error(`Unsupported language: ${language}. Supported: ${registry.getSupportedLanguages().join(', ')}`);
    }

    const plugin = registry.getPlugin(language);
    const config = plugin.getConfig();

    // Validate code using plugin
    const validation = plugin.validateCode(code, options);
    if (!validation.isValid) {
      throw new Error(`Code validation failed: ${validation.violations.map(v => v.message).join(', ')}`);
    }

    // Pre-process code
    const processedCode = plugin.preprocessCode(code);

    // Execute using Docker (or other execution method)
    const dockerConfig = plugin.getDockerConfig();
    const result = await this.executeWithDocker(processedCode, input, dockerConfig, options);

    // Post-process result
    const processedResult = plugin.postprocessResult(result);

    return {
      ...processedResult,
      language: config.id,
      languageName: config.name,
      languageVersion: config.version,
      executionTime: Date.now() - (options.startTime || Date.now()),
      validation: validation
    };
  }

  /**
   * Execute code using Docker
   * @param {string} code - Source code
   * @param {string} input - Input data
   * @param {Object} dockerConfig - Docker configuration
   * @param {Object} options - Execution options
   */
  async executeWithDocker(code, input, dockerConfig, options = {}) {
    // This would integrate with your existing DockerExecutor
    // For now, we'll return a mock result
    const DockerExecutor = require('../../utils/dockerExecutor');
    const dockerExecutor = new DockerExecutor();
    
    return await dockerExecutor.executeCode(
      dockerConfig.language || 'unknown',
      code,
      input,
      options.timeout || dockerConfig.timeout || 30000
    );
  }

  /**
   * Get all supported languages
   * @returns {Array} Array of language configurations
   */
  getSupportedLanguages() {
    return registry.getAllConfigs();
  }

  /**
   * Get language configuration
   * @param {string} language - Language identifier
   * @returns {Object} Language configuration
   */
  getLanguageConfig(language) {
    if (!registry.isSupported(language)) {
      throw new Error(`Language not supported: ${language}`);
    }
    return registry.getPlugin(language).getConfig();
  }

  /**
   * Get default code for a language
   * @param {string} language - Language identifier
   * @returns {string} Default code template
   */
  getDefaultCode(language) {
    if (!registry.isSupported(language)) {
      throw new Error(`Language not supported: ${language}`);
    }
    return registry.getPlugin(language).getDefaultCode();
  }

  /**
   * Get security patterns for a language
   * @param {string} language - Language identifier
   * @returns {Array} Security patterns
   */
  getSecurityPatterns(language) {
    if (!registry.isSupported(language)) {
      throw new Error(`Language not supported: ${language}`);
    }
    return registry.getPlugin(language).getSecurityPatterns();
  }

  /**
   * Validate code for a specific language
   * @param {string} language - Language identifier
   * @param {string} code - Source code
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateCode(language, code, options = {}) {
    if (!registry.isSupported(language)) {
      throw new Error(`Language not supported: ${language}`);
    }
    return registry.getPlugin(language).validateCode(code, options);
  }

  /**
   * Get code examples for a language
   * @param {string} language - Language identifier
   * @returns {Array} Code examples
   */
  getCodeExamples(language) {
    if (!registry.isSupported(language)) {
      throw new Error(`Language not supported: ${language}`);
    }
    return registry.getPlugin(language).getCodeExamples();
  }

  /**
   * Get documentation for a language
   * @param {string} language - Language identifier
   * @returns {Object} Documentation links
   */
  getDocumentation(language) {
    if (!registry.isSupported(language)) {
      throw new Error(`Language not supported: ${language}`);
    }
    return registry.getPlugin(language).getDocumentation();
  }

  /**
   * Get health status of all plugins
   * @returns {Object} Health status
   */
  async getHealthStatus() {
    return await registry.getHealthStatus();
  }

  /**
   * Register a custom language plugin
   * @param {string} languageId - Language identifier
   * @param {LanguagePlugin} plugin - Plugin instance
   */
  registerPlugin(languageId, plugin) {
    registry.register(languageId, plugin);
  }

  /**
   * Check if a language is supported
   * @param {string} language - Language identifier
   * @returns {boolean} True if supported
   */
  isLanguageSupported(language) {
    return registry.isSupported(language);
  }

  /**
   * Get plugin statistics
   * @returns {Object} Plugin statistics
   */
  getStats() {
    const languages = registry.getSupportedLanguages();
    const configs = registry.getAllConfigs();
    
    return {
      totalPlugins: languages.length,
      languages: languages,
      categories: [...new Set(configs.map(c => c.category))],
      features: [...new Set(configs.flatMap(c => c.features || []))],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Create a new language plugin from template
   * @param {string} languageId - Language identifier
   * @param {Object} config - Language configuration
   * @returns {string} Generated plugin code
   */
  generatePluginTemplate(languageId, config) {
    const template = `const LanguagePlugin = require('../base/LanguagePlugin');

/**
 * ${config.name} Language Plugin
 * Handles ${config.name} code execution and validation
 */
class ${config.name.replace(/\s+/g, '')}Plugin extends LanguagePlugin {
  getConfig() {
    return ${JSON.stringify(config, null, 2)};
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
          message: \`Forbidden pattern detected: \${pattern.source}\`
        });
      }
    }

    // Check code length
    if (code.length > (options.maxLength || 50000)) {
      violations.push({
        type: 'length',
        message: \`Code too long (\${code.length} chars, max \${options.maxLength || 50000})\`
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
      image: '${config.dockerImage || 'your-docker-image'}',
      filename: 'main${config.extension}',
      runCommand: ['${config.runCommand || 'your-command'}'],
      compileCommand: ${config.compileCommand ? JSON.stringify(config.compileCommand) : 'null'},
      setupCommands: [
        // Add setup commands here
      ],
      securityFlags: [
        // Add security flags here
      ],
      environment: {
        // Add environment variables here
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
      // Add security patterns here
      // Example: /dangerous_pattern/m
    ];
  }

  getDefaultCode() {
    return \`${config.defaultCode || `// Welcome to ${config.name} Collaborative Editor
// Start coding with your team!

// Add your ${config.name} code here`}\`;
  }

  async healthCheck() {
    try {
      return {
        status: 'healthy',
        message: '${config.name} runtime is working correctly',
        version: '${config.version}'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: \`${config.name} runtime error: \${error.message}\`,
        error: error.message
      };
    }
  }
}

module.exports = ${config.name.replace(/\s+/g, '')}Plugin;
`;

    return template;
  }
}

// Create singleton instance
const pluginManager = new PluginManager();

module.exports = pluginManager;
