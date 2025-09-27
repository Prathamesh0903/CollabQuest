const DOMPurify = require('isomorphic-dompurify');
const xss = require('xss');

/**
 * Sanitize HTML content to prevent XSS attacks
 */
const sanitizeHtml = (req, res, next) => {
  if (req.body) {
    // Sanitize string fields
    const stringFields = ['title', 'content'];
    stringFields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        // Remove any potentially dangerous HTML/JavaScript
        req.body[field] = DOMPurify.sanitize(req.body[field], {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
          ALLOWED_ATTR: []
        });
      }
    });

    // Sanitize tags array
    if (req.body.tags && Array.isArray(req.body.tags)) {
      req.body.tags = req.body.tags.map(tag => {
        if (typeof tag === 'string') {
          // Remove any HTML/JS and limit length
          return xss(tag.trim().slice(0, 50));
        }
        return tag;
      }).filter(Boolean);
    }
  }
  next();
};

/**
 * Validate and sanitize discuss thread input
 */
const validateDiscussInput = (req, res, next) => {
  const { title, content, tags } = req.body;

  // Check required fields
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  // Validate title
  if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 200) {
    return res.status(400).json({ error: 'Title must be between 3 and 200 characters' });
  }

  // Validate content
  if (typeof content !== 'string' || content.trim().length < 10 || content.trim().length > 10000) {
    return res.status(400).json({ error: 'Content must be between 10 and 10,000 characters' });
  }

  // Validate tags
  if (tags && !Array.isArray(tags)) {
    return res.status(400).json({ error: 'Tags must be an array' });
  }

  if (tags && tags.length > 10) {
    return res.status(400).json({ error: 'Maximum 10 tags allowed' });
  }

  next();
};

/**
 * Validate and sanitize reply input
 */
const validateReplyInput = (req, res, next) => {
  const { content } = req.body;

  // Check required fields
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Validate content
  if (typeof content !== 'string' || content.trim().length < 1 || content.trim().length > 5000) {
    return res.status(400).json({ error: 'Content must be between 1 and 5,000 characters' });
  }

  next();
};

module.exports = {
  sanitizeHtml,
  validateDiscussInput,
  validateReplyInput
};
