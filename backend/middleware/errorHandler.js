const ApiError = require('../utils/ApiError');

/**
 * Translates known Mongoose error types into clean ApiErrors so the response
 * shape stays consistent regardless of what threw.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return ApiError.badRequest('Validation failed', details);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // Mongo duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`${field} already exists`);
  }

  // JWT errors that slip through
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token expired');
  }

  return err;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  const statusCode = normalized.statusCode || 500;
  const isOperational = normalized.isOperational || false;

  if (!isOperational || statusCode === 500) {
    console.error('[Unhandled Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message: normalized.message || 'Something went wrong',
    ...(normalized.details ? { details: normalized.details } : {}),
    ...(process.env.NODE_ENV === 'development' && !isOperational ? { stack: err.stack } : {}),
  });
};

const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFoundHandler };
