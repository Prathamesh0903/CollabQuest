/**
 * Base Language Plugin Class
 * Defines the interface that all language plugins must implement
 */
class LanguagePlugin {
  constructor() {
    if (this.constructor === LanguagePlugin) {
      throw new Error('LanguagePlugin is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Get language configuration
   * @returns {Object} Language configuration
   */
  getConfig() {
    throw new Error('getConfig() must be implemented by subclass');
  }

  /**
   * Validate code for security and syntax
   * @param {string} code - Source code to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateCode(code, options = {}) {
    throw new Error('validateCode() must be implemented by subclass');
  }

  /**
   * Get Docker configuration for execution
   * @returns {Object} Docker configuration
   */
  getDockerConfig() {
    throw new Error('getDockerConfig() must be implemented by subclass');
  }

  /**
   * Get security patterns for this language
   * @returns {Array} Array of forbidden patterns
   */
  getSecurityPatterns() {
    throw new Error('getSecurityPatterns() must be implemented by subclass');
  }

  /**
   * Get default code template for this language
   * @returns {string} Default code template
   */
  getDefaultCode() {
    throw new Error('getDefaultCode() must be implemented by subclass');
  }

  /**
   * Optional: Health check for the language runtime
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    return {
      status: 'unknown',
      message: 'Health check not implemented for this language'
    };
  }

  /**
   * Optional: Pre-process code before execution
   * @param {string} code - Source code
   * @returns {string} Processed code
   */
  preprocessCode(code) {
    return code; // Default: no preprocessing
  }

  /**
   * Optional: Post-process execution result
   * @param {Object} result - Execution result
   * @returns {Object} Processed result
   */
  postprocessResult(result) {
    return result; // Default: no postprocessing
  }

  /**
   * Optional: Get language-specific syntax highlighting rules
   * @returns {Object} Syntax highlighting configuration
   */
  getSyntaxHighlighting() {
    return {}; // Default: no custom syntax highlighting
  }

  /**
   * Optional: Get language-specific code formatting rules
   * @returns {Object} Formatting configuration
   */
  getFormattingRules() {
    return {}; // Default: no custom formatting
  }

  /**
   * Optional: Get language-specific linting rules
   * @returns {Object} Linting configuration
   */
  getLintingRules() {
    return {}; // Default: no custom linting
  }

  /**
   * Optional: Get language-specific debugging configuration
   * @returns {Object} Debugging configuration
   */
  getDebuggingConfig() {
    return {}; // Default: no custom debugging
  }

  /**
   * Optional: Get language-specific performance optimizations
   * @returns {Object} Performance configuration
   */
  getPerformanceConfig() {
    return {}; // Default: no custom performance settings
  }

  /**
   * Optional: Get language-specific error messages
   * @param {string} errorType - Type of error
   * @param {Object} context - Error context
   * @returns {string} User-friendly error message
   */
  getErrorMessage(errorType, context = {}) {
    return `Error in ${this.getConfig().name}: ${errorType}`;
  }

  /**
   * Optional: Get language-specific code examples
   * @returns {Array} Array of code examples
   */
  getCodeExamples() {
    return []; // Default: no examples
  }

  /**
   * Optional: Get language-specific documentation
   * @returns {Object} Documentation links and info
   */
  getDocumentation() {
    return {}; // Default: no documentation
  }
}

module.exports = LanguagePlugin;
