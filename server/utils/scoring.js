// Scoring logic for battle mode

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Calculate score for a code submission
 * @param {Object} params
 * @param {boolean} isFirstCorrect - Is this the first correct solution?
 * @param {boolean} optimalComplexity - Does the code have optimal time complexity?
 * @param {number} codeLength - Number of characters in code
 * @param {number} minCodeLength - Minimum code length among all submissions
 * @param {number} failedTestCases - Number of failed test cases
 * @returns {number}
 */
function calculateScore({ isFirstCorrect, optimalComplexity, codeLength, minCodeLength, failedTestCases }) {
  let score = 0;
  if (isFirstCorrect) score += 50;
  if (optimalComplexity) score += 30;
  // Brevity: within 10% of min code length gets full 20 pts, else partial
  if (minCodeLength > 0) {
    const ratio = codeLength / minCodeLength;
    if (ratio <= 1.1) score += 20;
    else if (ratio <= 1.3) score += 10;
  }
  // Deduct 10 pts per failed test case
  if (failedTestCases > 0) score -= 10 * failedTestCases;
  return Math.max(score, 0);
}

module.exports = {
  levenshtein,
  calculateScore
}; 