const config = require('../config');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'An internal server error occurred';

  // Server-side logging
  console.error(`[SafePath Error] ${req.method} ${req.originalUrl} - Status ${statusCode}:`, err.stack || err.message);

  const response = {
    error: message
  };

  // Only include stack trace if explicitly in development mode and requested
  if (config.nodeEnv === 'development' && statusCode === 500) {
    response.debug = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
