const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { verifyAccessToken } = require('../utils/jwt');

/**
 * Verifies the Bearer access token, loads the user, and attaches it to req.user.
 * Rejects if the user no longer exists or has been deactivated (e.g. by an admin)
 * even if the token itself is still cryptographically valid.
 */
const protect = catchAsync(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('You are not logged in. Please log in to continue.');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Session expired. Please refresh your token.');
    }
    throw ApiError.unauthorized('Invalid authentication token.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw ApiError.unauthorized('The user belonging to this token no longer exists.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated.');
  }

  req.user = user;
  next();
});

/**
 * Optional auth: attaches req.user if a valid token is present, but does not
 * reject the request if it's absent or invalid. Useful for public property
 * browsing endpoints that personalize output (e.g. favorite state) when logged in.
 */
const optionalAuth = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    } catch (err) {
      // silently ignore — this route works unauthenticated too
    }
  }
  next();
});

/**
 * Restricts access to specific roles. Usage: restrictTo('COMPANY_ADMIN', 'AGENT')
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized());
  }
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden('You do not have permission to perform this action.'));
  }
  next();
};

module.exports = { protect, optionalAuth, restrictTo };
