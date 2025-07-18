const axios = require('axios');

/**
 * Problem structure returned by Gemini
 * @typedef {Object} GeneratedProblem
 * @property {string} description
 * @property {Array<{input: string, output: string}>} testCases
 * @property {string} solution
 * @property {string[]} hints
 */

/**
 * Calls Gemini API to generate coding problems and parses the response.
 * @param {string} language - Programming language (e.g., 'JavaScript')
 * @param {string} difficulty - Difficulty level (e.g., 'Easy', 'Medium', 'Hard')
 * @returns {Promise<GeneratedProblem[]>}
 */
async function generateProblemsWithGemini(language, difficulty) {
  const prompt = `Generate 3 ${language} ${difficulty} problems with:\n- Clear description\n- 3 test cases\n- Optimal solution\n- 2 progressive hints\nOutput as JSON`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key not set');

  const response = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
    {
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      }
    }
  );

  // Gemini returns a stringified JSON in the response
  let problemsRaw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!problemsRaw) throw new Error('No problems returned from Gemini');

  let problems;
  try {
    problems = JSON.parse(problemsRaw);
  } catch (e) {
    throw new Error('Failed to parse Gemini response as JSON');
  }

  // Optionally validate structure here
  if (!Array.isArray(problems) || problems.length !== 3) {
    throw new Error('Gemini did not return 3 problems');
  }

  return problems;
}

module.exports = { generateProblemsWithGemini }; 