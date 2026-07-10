import xss from 'xss';

/**
 * Sanitize a single string value
 * - Trims whitespace
 * - Escapes XSS characters
 */
function sanitizeString(value) {
  if (typeof value !== 'string') return value;
  return xss(value.trim());
}

/**
 * Recursively sanitize an object's string values
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip binary data (file uploads)
      if (Buffer.isBuffer(value)) {
        sanitized[key] = value;
      } else {
        sanitized[key] = sanitizeObject(value);
      }
    }
    return sanitized;
  }
  return obj;
}

/**
 * Detect potentially malicious payloads
 * Blocks common SQL injection patterns and NoSQL injection attempts
 */
function detectMaliciousPayload(obj) {
  if (obj === null || obj === undefined) return { safe: true, threats: [] };

  const threats = [];
  
  const maliciousPatterns = [
    // SQL injection patterns
    { pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i, type: 'SQL Injection' },
    { pattern: /(--|;|\/\*|\*\/|xp_|sp_)/i, type: 'SQL Injection' },
    { pattern: /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i, type: 'SQL Injection' },
    { pattern: /('\s*(OR|AND)\s*')/i, type: 'SQL Injection' },
    // NoSQL injection patterns
    { pattern: /\$where|\$ne|\$gt|\$lt|\$regex|\$exists|\$in|\$nin/i, type: 'NoSQL Injection' },
    // Command injection patterns
    { pattern: /(\||;|&|\$\(|`)/, type: 'Command Injection' },
    // Path traversal
    { pattern: /\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/i, type: 'Path Traversal' },
    // Script tags (basic XSS)
    { pattern: /<script[\s>]/i, type: 'XSS Attempt' },
    { pattern: /javascript:/i, type: 'XSS Attempt' },
    { pattern: /on(error|load|click|mouse)\s*=/i, type: 'XSS Attempt' },
  ];

  function checkValue(value, path = '') {
    if (typeof value === 'string') {
      for (const { pattern, type } of maliciousPatterns) {
        if (pattern.test(value)) {
          threats.push({ type, path: path || 'root', value: value.substring(0, 100) });
        }
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => checkValue(item, `${path}[${i}]`));
    } else if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        checkValue(val, path ? `${path}.${key}` : key);
      }
    }
  }

  checkValue(obj);
  return { safe: threats.length === 0, threats };
}

/**
 * Middleware: Sanitize all string inputs in request body, query, and params
 * Trims whitespace and escapes XSS characters
 */
export function sanitizeInput(req, res, next) {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query params
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize route params
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  next();
}

/**
 * Middleware: Detect and block malicious payloads
 * Returns 400 with threat details if malicious content is detected
 */
export function blockMaliciousPayload(req, res, next) {
  const sources = [
    { name: 'body', data: req.body },
    { name: 'query', data: req.query },
    { name: 'params', data: req.params },
  ];

  const allThreats = [];

  for (const { name, data } of sources) {
    if (data && typeof data === 'object') {
      const { safe, threats } = detectMaliciousPayload(data);
      if (!safe) {
        allThreats.push(...threats.map(t => ({ ...t, source: name })));
      }
    }
  }

  if (allThreats.length > 0) {
    console.warn(`[SECURITY] Malicious payload detected from ${req.ip}:`, allThreats);
    return res.status(400).json({
      success: false,
      message: 'Request contains potentially malicious content.',
      error: 'Bad Request',
    });
  }

  next();
}
