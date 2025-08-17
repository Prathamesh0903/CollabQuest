const express = require('express');
const router = express.Router();
const pluginManager = require('../plugins/languagePlugins/PluginManager');
const auth = require('../middleware/auth');

/**
 * @route POST /api/execute/plugin
 * @desc Execute code using the plugin system
 * @access Public (or Private with auth middleware)
 */
router.post('/plugin', async (req, res) => {
  const startTime = Date.now();
  const { language, code, input = '', timeout, memoryLimit } = req.body;

  try {
    // Input validation
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required',
        code: 'MISSING_REQUIRED_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    // Check if language is supported
    if (!pluginManager.isLanguageSupported(language)) {
      const supportedLanguages = pluginManager.getSupportedLanguages().map(l => l.id);
      return res.status(400).json({
        success: false,
        error: `Unsupported language. Supported: ${supportedLanguages.join(', ')}`,
        code: 'UNSUPPORTED_LANGUAGE',
        timestamp: new Date().toISOString()
      });
    }

    // Validate code length
    if (code.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Code too long (max 50KB)',
        code: 'CODE_TOO_LONG',
        timestamp: new Date().toISOString()
      });
    }

    // Validate input length
    if (input.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Input too long (max 1KB)',
        code: 'INPUT_TOO_LONG',
        timestamp: new Date().toISOString()
      });
    }

    // Execute the code using plugin system
    const result = await pluginManager.executeCode(language, code, input, {
      timeout: timeout || 30000,
      memoryLimit: memoryLimit || '256MB',
      startTime
    });

    const executionTime = Date.now() - startTime;

    // Prepare comprehensive response
    res.json({
      success: true,
      data: {
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        compile_output: result.compile_output || '',
        status: result.status || 'success',
        executionTime,
        language: result.language,
        languageName: result.languageName,
        languageVersion: result.languageVersion,
        codeLength: code.length,
        inputLength: input.length,
        validation: result.validation
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        plugin: true
      }
    });

  } catch (error) {
    console.error('Plugin execution error:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Code execution failed',
      code: 'EXECUTION_ERROR',
      timestamp: new Date().toISOString(),
      metadata: {
        language,
        codeLength: code?.length || 0,
        executionTime: Date.now() - startTime,
        plugin: true
      }
    };

    // Add validation details if available
    if (error.validation) {
      errorResponse.validation = error.validation;
    }

    res.status(500).json(errorResponse);
  }
});

/**
 * @route GET /api/execute/plugin/languages
 * @desc Get list of supported programming languages from plugins
 * @access Public
 */
router.get('/plugin/languages', async (req, res) => {
  try {
    const languages = pluginManager.getSupportedLanguages();
    
    res.json({
      success: true,
      data: {
        languages,
        count: languages.length,
        categories: [...new Set(languages.map(l => l.category))],
        features: [...new Set(languages.flatMap(l => l.features || []))]
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        plugin: true
      }
    });
  } catch (error) {
    console.error('Error fetching plugin languages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch languages',
      code: 'FETCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/execute/plugin/languages/:languageId
 * @desc Get detailed information about a specific language
 * @access Public
 */
router.get('/plugin/languages/:languageId', async (req, res) => {
  try {
    const { languageId } = req.params;
    
    if (!pluginManager.isLanguageSupported(languageId)) {
      return res.status(404).json({
        success: false,
        error: 'Language not found',
        code: 'LANGUAGE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const config = pluginManager.getLanguageConfig(languageId);
    const examples = pluginManager.getCodeExamples(languageId);
    const documentation = pluginManager.getDocumentation(languageId);
    const defaultCode = pluginManager.getDefaultCode(languageId);

    res.json({
      success: true,
      data: {
        config,
        examples,
        documentation,
        defaultCode
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        plugin: true
      }
    });
  } catch (error) {
    console.error('Error fetching language details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch language details',
      code: 'FETCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/execute/plugin/validate
 * @desc Validate code for a specific language
 * @access Public
 */
router.post('/plugin/validate', async (req, res) => {
  try {
    const { language, code, options = {} } = req.body;

    if (!language || !code) {
      return res.status(400).json({
        success: false,
        error: 'Language and code are required',
        code: 'MISSING_REQUIRED_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    if (!pluginManager.isLanguageSupported(language)) {
      const supportedLanguages = pluginManager.getSupportedLanguages().map(l => l.id);
      return res.status(400).json({
        success: false,
        error: `Unsupported language. Supported: ${supportedLanguages.join(', ')}`,
        code: 'UNSUPPORTED_LANGUAGE',
        timestamp: new Date().toISOString()
      });
    }

    const validation = pluginManager.validateCode(language, code, options);

    res.json({
      success: true,
      data: validation,
      metadata: {
        language,
        codeLength: code.length,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        plugin: true
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route GET /api/execute/plugin/health
 * @desc Check the health of all language plugins
 * @access Public
 */
router.get('/plugin/health', async (req, res) => {
  try {
    const health = await pluginManager.getHealthStatus();
    const stats = pluginManager.getStats();

    res.json({
      success: true,
      data: {
        health,
        stats,
        uptime: process.uptime()
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        plugin: true
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @route POST /api/execute/plugin/examples
 * @desc Get code examples for a language
 * @access Public
 */
router.post('/plugin/examples', async (req, res) => {
  try {
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Language is required',
        code: 'MISSING_LANGUAGE',
        timestamp: new Date().toISOString()
      });
    }

    if (!pluginManager.isLanguageSupported(language)) {
      const supportedLanguages = pluginManager.getSupportedLanguages().map(l => l.id);
      return res.status(400).json({
        success: false,
        error: `Unsupported language. Supported: ${supportedLanguages.join(', ')}`,
        code: 'UNSUPPORTED_LANGUAGE',
        timestamp: new Date().toISOString()
      });
    }

    const examples = pluginManager.getCodeExamples(language);
    const defaultCode = pluginManager.getDefaultCode(language);

    res.json({
      success: true,
      data: {
        examples,
        defaultCode
      },
      metadata: {
        language,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        plugin: true
      }
    });
  } catch (error) {
    console.error('Error fetching examples:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch examples',
      code: 'FETCH_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
