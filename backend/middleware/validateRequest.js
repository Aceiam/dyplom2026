const AppError = require('../utils/AppError');

const validateRequest = (schema, source = 'body') => (req, res, next) => {
  const { value, error } = schema.validate(req[source], {
    abortEarly: false,
    // Видаляє поля, які не описані в Joi-схемі.
    stripUnknown: true,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    return next(new AppError('Validation failed', 400, details));
  }

  req[source] = value;
  return next();
};

module.exports = validateRequest;
