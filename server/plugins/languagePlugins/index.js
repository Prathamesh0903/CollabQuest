const fs = require('fs').promises;
const path = require('path');

/**
 * Language Plugin Registry
 * Manages all language plugins dynamically
 */
class LanguagePluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.pluginConfigs = new Map();
    this.loaded = false;
  }

  /**
   * Register a language plugin
   * @param {string} languageId - Unique language identifier
   * @param {LanguagePlugin} plugin - Plugin instance
   */
  register(languageId, plugin) {
    if (this.plugins.has(languageId)) {
      throw new Error(`Language plugin '${languageId}' is already registered`);
    }

    // Validate plugin interface
    this.validatePlugin(plugin, languageId);
    
    this.plugins.set(languageId, plugin);
    this.pluginConfigs.set(languageId, plugin.getConfig());
    
    console.log(`✅ Registered language plugin: ${languageId}`);
  }

  /**
   * Get a language plugin by ID
   * @param {string} languageId - Language identifier
   * @returns {LanguagePlugin} Plugin instance
   */
  getPlugin(languageId) {
    const plugin = this.plugins.get(languageId);
    if (!plugin) {
      throw new Error(`Language plugin '${languageId}' not found`);
    }
    return plugin;
  }

  /**
   * Get all registered language configurations
   * @returns {Array} Array of language configs
   */
  getAllConfigs() {
    return Array.from(this.pluginConfigs.values());
  }

  /**
   * Get supported language IDs
   * @returns {Array} Array of language IDs
   */
  getSupportedLanguages() {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a language is supported
   * @param {string} languageId - Language identifier
   * @returns {boolean} True if supported
   */
  isSupported(languageId) {
    return this.plugins.has(languageId);
  }

  /**
   * Validate plugin interface
   * @param {LanguagePlugin} plugin - Plugin to validate
   * @param {string} languageId - Language ID for error messages
   */
  validatePlugin(plugin, languageId) {
    const requiredMethods = [
      'getConfig',
      'validateCode',
      'getDockerConfig',
      'getSecurityPatterns',
      'getDefaultCode'
    ];

    for (const method of requiredMethods) {
      if (typeof plugin[method] !== 'function') {
        throw new Error(`Plugin '${languageId}' missing required method: ${method}`);
      }
    }

    // Validate config structure
    const config = plugin.getConfig();
    const requiredConfigFields = ['id', 'name', 'version', 'extension', 'icon'];
    
    for (const field of requiredConfigFields) {
      if (!config[field]) {
        throw new Error(`Plugin '${languageId}' config missing required field: ${field}`);
      }
    }
  }

  /**
   * Auto-load plugins from plugins directory
   */
  async autoLoadPlugins() {
    if (this.loaded) return;

    const pluginsDir = path.join(__dirname, 'languages');
    
    try {
      const files = await fs.readdir(pluginsDir);
      
      for (const file of files) {
        if (file.endsWith('.js') && file !== 'index.js') {
          const pluginPath = path.join(pluginsDir, file);
          const pluginModule = require(pluginPath);
          
          // Support both default export and named exports
          const PluginClass = pluginModule.default || pluginModule;
          
          if (PluginClass && typeof PluginClass === 'function') {
            const plugin = new PluginClass();
            const config = plugin.getConfig();
            this.register(config.id, plugin);
          }
        }
      }
      
      this.loaded = true;
      console.log(`🎯 Auto-loaded ${this.plugins.size} language plugins`);
    } catch (error) {
      console.error('Failed to auto-load plugins:', error);
    }
  }

  /**
   * Get health status of all plugins
   * @returns {Object} Health status
   */
  async getHealthStatus() {
    const status = {
      total: this.plugins.size,
      healthy: 0,
      unhealthy: 0,
      details: {}
    };

    for (const [languageId, plugin] of this.plugins) {
      try {
        if (typeof plugin.healthCheck === 'function') {
          const health = await plugin.healthCheck();
          status.details[languageId] = health;
          if (health.status === 'healthy') {
            status.healthy++;
          } else {
            status.unhealthy++;
          }
        } else {
          status.details[languageId] = { status: 'unknown', message: 'No health check method' };
          status.unhealthy++;
        }
      } catch (error) {
        status.details[languageId] = { status: 'error', message: error.message };
        status.unhealthy++;
      }
    }

    return status;
  }
}

// Create singleton instance
const registry = new LanguagePluginRegistry();

module.exports = registry;
