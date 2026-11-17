/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Handle PostgreSQL known error codes if needed
  if (err.code === '23505') {
    // Unique violation
    return res.status(409).json({
      error: 'Conflict: A record with this information already exists.',
      detail: err.detail,
    });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      error: 'Invalid reference: Referenced entity does not exist.',
      detail: err.detail,
    });
  }

  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;
