const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  const response = {
    message: isServerError ? 'Internal server error' : err.message,
  };

  if (err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && isServerError) {
    response.error = err.message;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
