const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiError } = require('../utils/helpers');

/**
 * Verifies the Bearer token and attaches { id, role, ...claims } to req.user.
 * Use `requireRole('teacher')` / `requireRole('student')` after this to
 * restrict a route to one role.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, `This action requires role: ${roles.join(' or ')}`));
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
