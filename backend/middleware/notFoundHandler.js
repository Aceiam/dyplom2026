const AppError = require('../utils/AppError');

// Спрацьовує, якщо жоден route вище не обробив запит.
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

module.exports = notFoundHandler;
