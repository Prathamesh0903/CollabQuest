const axios = require('axios');

// Map language to Judge0 language_id (add more as needed)
const JUDGE0_LANGUAGES = {
  javascript: 63, // Node.js
  python: 71,     // Python 3
};

async function executeCode(language, sourceCode, input = '') {
  // Try Judge0 first
  try {
    const language_id = JUDGE0_LANGUAGES[language];
    if (!language_id) throw new Error('Unsupported language');
    // Submit code to Judge0
    const { data: submission } = await axios.post(
      'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true',
      {
        source_code: sourceCode,
        language_id,
        stdin: input,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY || '',
        },
      }
    );
    return {
      stdout: submission.stdout,
      stderr: submission.stderr,
      compile_output: submission.compile_output,
      status: submission.status,
    };
  } catch (err) {
    // Optionally fallback to Piston API
    // ...
    return { error: err.message };
  }
}

module.exports = { executeCode }; 