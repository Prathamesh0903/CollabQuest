function generateSessionId() {
  // 8-char base36 unique-ish id
  return Math.random().toString(36).slice(2, 10);
}

module.exports = { generateSessionId };


