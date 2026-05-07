const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isServerError = statusCode >= 500;

  // Для 500 не показуємо користувачу технічний текст помилки.
  const response = {
    message: isServerError ? 'Internal server error' : err.message,
  };

  if (err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && isServerError) {
    // У розробці залишаємо технічну причину, щоб легше було дебажити.
    response.error = err.message;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
