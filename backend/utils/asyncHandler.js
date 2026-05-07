// Обгортає async controller і передає помилки в errorHandler через next().
const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = asyncHandler;
