const ApiError = require('../utils/ApiError');

/* eslint-disable no-unused-vars */
function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  // Multer & Mongo errors normalisation
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  const payload = {};

  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field} already in use`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    payload.details = Object.fromEntries(
      Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
    );
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id';
  }

  if (err.details) payload.details = err.details;
  if (err.code && typeof err.code === 'string') payload.code = err.code;

  // Never leak stack in production
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
    payload.stack = err.stack;
  }

  res.status(status).json({ error: message, ...payload });
}

module.exports = { notFound, errorHandler };
/* eslint-enable no-unused-vars */
