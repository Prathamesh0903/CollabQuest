/**
 * Code Execution API Examples
 * 
 * This file demonstrates how to send code to the /api/execute endpoint
 * and handle the responses in vanilla JavaScript.
 */

// Types for code execution
/**
 * @typedef {Object} CodeExecutionRequest
 * @property {string} language - Programming language (javascript, python, java, etc.)
 * @property {string} code - Source code to execute
 * @property {string} [input] - Optional input data
 * @property {number} [timeout] - Execution timeout in milliseconds
 * @property {string} [memoryLimit] - Memory limit (e.g., "256MB")
 */

/**
 * @typedef {Object} CodeExecutionResponse
 * @property {boolean} success - Whether execution was successful
 * @property {string} [stdout] - Standard output
 * @property {string} [stderr] - Standard error
 * @property {string} [compile_output] - Compilation output (for compiled languages)
 * @property {'success'|'error'|'timeout'} [status] - Execution status
 * @property {number} [executionTime] - Execution time in milliseconds
 * @property {string} [error] - Error message
 * @property {Object} [metrics] - Execution metrics
 */

/**
 * Supported programming languages
 */
const SUPPORTED_LANGUAGES = [
  'javascript', 'python', 'java', 'cpp', 'csharp', 
  'typescript', 'go', 'rust', 'php', 'ruby'
];

/**
 * Example 1: Basic code execution
 * @param {string} language - Programming language
 * @param {string} code - Source code
 * @param {string} input - Optional input data
 * @returns {Promise<CodeExecutionResponse>}
 */
async function executeCodeBasic(language, code, input = '') {
  try {
    // Validate inputs
    if (!language || !code) {
      throw new Error('Language and code are required');
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw new Error(`Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
    }

    // Prepare request body
    const requestBody = {
      language,
      code,
      input
    };

    console.log('Sending code execution request:', requestBody);

    // Send request to API
    const response = await fetch('http://localhost:5000/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Received HTML instead of JSON:', text.substring(0, 200));
      throw new Error(`Server returned ${response.status} with non-JSON response. Please check if the server is running.`);
    }

    const result = await response.json();
    console.log('Code execution result:', result);

    return result;

  } catch (error) {
    console.error('Code execution error:', error);
    
    let errorMessage = error.message;
    
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to server. Please ensure the server is running on http://localhost:5000';
    } else if (errorMessage.includes('Unexpected token')) {
      errorMessage = 'Server returned invalid response. This usually means the server is not running or there\'s a configuration issue.';
    }
    
    return {
      success: false,
      error: `Failed to execute code: ${errorMessage}`,
      status: 'error'
    };
  }
}

/**
 * Example 2: Authenticated code execution
 * @param {string} language - Programming language
 * @param {string} code - Source code
 * @param {string} input - Optional input data
 * @param {string} token - Authentication token
 * @returns {Promise<CodeExecutionResponse>}
 */
async function executeCodeAuthenticated(language, code, input = '', token) {
  try {
    // Validate inputs
    if (!language || !code) {
      throw new Error('Language and code are required');
    }

    if (!token) {
      throw new Error('Authentication token is required');
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw new Error(`Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
    }

    // Prepare request body with additional options
    const requestBody = {
      language,
      code,
      input,
      timeout: 10000, // 10 seconds
      memoryLimit: '256MB'
    };

    console.log('Sending authenticated code execution request:', requestBody);

    // Send request to authenticated endpoint
    const response = await fetch('http://localhost:5000/api/execute/secure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Received HTML instead of JSON:', text.substring(0, 200));
      throw new Error(`Server returned ${response.status} with non-JSON response.`);
    }

    const result = await response.json();
    console.log('Authenticated code execution result:', result);

    return result;

  } catch (error) {
    console.error('Authenticated code execution error:', error);
    
    let errorMessage = error.message;
    
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to server. Please ensure the server is running on http://localhost:5000';
    } else if (errorMessage.includes('401')) {
      errorMessage = 'Authentication failed. Please log in again.';
    }
    
    return {
      success: false,
      error: `Failed to execute code: ${errorMessage}`,
      status: 'error'
    };
  }
}

/**
 * Example 3: Code execution with custom timeout and memory limits
 * @param {string} language - Programming language
 * @param {string} code - Source code
 * @param {string} input - Optional input data
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} memoryLimit - Memory limit
 * @returns {Promise<CodeExecutionResponse>}
 */
async function executeCodeWithLimits(language, code, input = '', timeout = 5000, memoryLimit = '128MB') {
  try {
    // Validate inputs
    if (!language || !code) {
      throw new Error('Language and code are required');
    }

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw new Error(`Unsupported language. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
    }

    // Prepare request body with custom limits
    const requestBody = {
      language,
      code,
      input,
      timeout,
      memoryLimit
    };

    console.log('Sending code execution request with limits:', requestBody);

    // Send request to API
    const response = await fetch('http://localhost:5000/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Received HTML instead of JSON:', text.substring(0, 200));
      throw new Error(`Server returned ${response.status} with non-JSON response.`);
    }

    const result = await response.json();
    console.log('Code execution result with limits:', result);

    return result;

  } catch (error) {
    console.error('Code execution with limits error:', error);
    
    let errorMessage = error.message;
    
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to server. Please ensure the server is running on http://localhost:5000';
    }
    
    return {
      success: false,
      error: `Failed to execute code: ${errorMessage}`,
      status: 'error'
    };
  }
}

/**
 * Example 4: Display execution results in the UI
 * @param {CodeExecutionResponse} result - Execution result
 * @param {string} outputElementId - ID of the element to display output
 */
function displayExecutionResult(result, outputElementId = 'execution-output') {
  const outputElement = document.getElementById(outputElementId);
  
  if (!outputElement) {
    console.error(`Output element with ID '${outputElementId}' not found`);
    return;
  }

  // Clear previous output
  outputElement.innerHTML = '';

  // Create output HTML
  let outputHTML = '';

  if (result.success) {
    // Success case
    outputHTML += `
      <div class="execution-success">
        <h3>✅ Execution Successful</h3>
        <div class="execution-info">
          <span class="status-badge success">${result.status || 'success'}</span>
          ${result.executionTime ? `<span class="execution-time">Time: ${formatExecutionTime(result.executionTime)}</span>` : ''}
        </div>
    `;

    if (result.stdout) {
      outputHTML += `
        <div class="output-section">
          <div class="output-label">stdout:</div>
          <pre class="output-content stdout">${escapeHtml(result.stdout)}</pre>
        </div>
      `;
    }

    if (result.stderr) {
      outputHTML += `
        <div class="output-section">
          <div class="output-label">stderr:</div>
          <pre class="output-content stderr">${escapeHtml(result.stderr)}</pre>
        </div>
      `;
    }

    if (result.compile_output) {
      outputHTML += `
        <div class="output-section">
          <div class="output-label">compile_output:</div>
          <pre class="output-content compile">${escapeHtml(result.compile_output)}</pre>
        </div>
      `;
    }

    outputHTML += '</div>';

  } else {
    // Error case
    outputHTML += `
      <div class="execution-error">
        <h3>❌ Execution Failed</h3>
        <div class="execution-info">
          <span class="status-badge error">${result.status || 'error'}</span>
          ${result.executionTime ? `<span class="execution-time">Time: ${formatExecutionTime(result.executionTime)}</span>` : ''}
        </div>
    `;

    if (result.error) {
      outputHTML += `
        <div class="output-section">
          <div class="output-label">error:</div>
          <pre class="output-content error">${escapeHtml(result.error)}</pre>
        </div>
      `;
    }

    if (result.stderr) {
      outputHTML += `
        <div class="output-section">
          <div class="output-label">stderr:</div>
          <pre class="output-content stderr">${escapeHtml(result.stderr)}</pre>
        </div>
      `;
    }

    outputHTML += '</div>';
  }

  // Add metrics if available
  if (result.metrics) {
    outputHTML += `
      <div class="execution-metrics">
        <h4>Execution Metrics</h4>
        <ul>
          <li><strong>Language:</strong> ${result.metrics.language}</li>
          <li><strong>Code Length:</strong> ${result.metrics.codeLength} characters</li>
          <li><strong>Execution Duration:</strong> ${formatExecutionTime(result.metrics.executionDuration)}</li>
          ${result.metrics.memoryUsed ? `<li><strong>Memory Used:</strong> ${result.metrics.memoryUsed}</li>` : ''}
        </ul>
      </div>
    `;
  }

  // Add runtime logs if available
  if (result.runtime_logs && result.runtime_logs.length > 0) {
    outputHTML += `
      <div class="runtime-logs">
        <h4>Runtime Logs</h4>
        <div class="logs-container">
          ${result.runtime_logs.map(log => `
            <div class="log-entry log-${log.level.toLowerCase()}">
              <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
              <span class="log-level">${log.level}</span>
              <span class="log-message">${escapeHtml(log.message)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Set the HTML content
  outputElement.innerHTML = outputHTML;
}

/**
 * Example 5: Create a simple code execution UI
 * @param {string} containerId - ID of the container element
 */
function createCodeExecutionUI(containerId = 'code-execution-container') {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container element with ID '${containerId}' not found`);
    return;
  }

  container.innerHTML = `
    <div class="code-execution-ui">
      <h2>Code Execution Demo</h2>
      
      <div class="language-selector">
        <label for="language-select">Programming Language:</label>
        <select id="language-select">
          ${SUPPORTED_LANGUAGES.map(lang => 
            `<option value="${lang}">${lang.charAt(0).toUpperCase() + lang.slice(1)}</option>`
          ).join('')}
        </select>
      </div>

      <div class="code-editor-section">
        <h3>Code Editor</h3>
        <textarea id="code-editor" placeholder="Enter your code here..." rows="10"></textarea>
      </div>

      <div class="input-section">
        <label for="custom-input">Custom Input (optional):</label>
        <textarea id="custom-input" placeholder="Enter input data for your code..." rows="3"></textarea>
      </div>

      <div class="execution-controls">
        <button id="execute-basic" class="execute-btn">Execute Basic</button>
        <button id="execute-auth" class="execute-btn">Execute (Auth)</button>
        <button id="execute-limits" class="execute-btn">Execute (Limits)</button>
        <button id="clear-output" class="clear-btn">Clear Output</button>
      </div>

      <div id="execution-output" class="execution-output"></div>
    </div>
  `;

  // Add event listeners
  document.getElementById('execute-basic').addEventListener('click', async () => {
    const language = document.getElementById('language-select').value;
    const code = document.getElementById('code-editor').value;
    const input = document.getElementById('custom-input').value;

    if (!code.trim()) {
      alert('Please enter some code to execute');
      return;
    }

    const result = await executeCodeBasic(language, code, input);
    displayExecutionResult(result, 'execution-output');
  });

  document.getElementById('execute-auth').addEventListener('click', async () => {
    const language = document.getElementById('language-select').value;
    const code = document.getElementById('code-editor').value;
    const input = document.getElementById('custom-input').value;
    
    // Get token from localStorage or prompt user
    const token = localStorage.getItem('authToken') || prompt('Enter your authentication token:');
    
    if (!token) {
      alert('Authentication token is required');
      return;
    }

    if (!code.trim()) {
      alert('Please enter some code to execute');
      return;
    }

    const result = await executeCodeAuthenticated(language, code, input, token);
    displayExecutionResult(result, 'execution-output');
  });

  document.getElementById('execute-limits').addEventListener('click', async () => {
    const language = document.getElementById('language-select').value;
    const code = document.getElementById('code-editor').value;
    const input = document.getElementById('custom-input').value;

    if (!code.trim()) {
      alert('Please enter some code to execute');
      return;
    }

    const result = await executeCodeWithLimits(language, code, input, 3000, '64MB');
    displayExecutionResult(result, 'execution-output');
  });

  document.getElementById('clear-output').addEventListener('click', () => {
    document.getElementById('execution-output').innerHTML = '';
  });

  // Set default code
  document.getElementById('code-editor').value = `// Welcome to the Code Execution Demo!
console.log("Hello, World!");

function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("Developer"));
console.log("Code execution successful! 🎉");`;
}

// Utility functions

/**
 * Format execution time
 * @param {number} time - Time in milliseconds
 * @returns {string} Formatted time string
 */
function formatExecutionTime(time) {
  if (!time) return '';
  return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    executeCodeBasic,
    executeCodeAuthenticated,
    executeCodeWithLimits,
    displayExecutionResult,
    createCodeExecutionUI,
    SUPPORTED_LANGUAGES
  };
}

// Make functions available globally for browser use
if (typeof window !== 'undefined') {
  window.CodeExecutionAPI = {
    executeCodeBasic,
    executeCodeAuthenticated,
    executeCodeWithLimits,
    displayExecutionResult,
    createCodeExecutionUI,
    SUPPORTED_LANGUAGES
  };
}
