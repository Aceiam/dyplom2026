class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);

    // statusCode дозволяє service явно сказати: це 400, 404 чи 500.
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
