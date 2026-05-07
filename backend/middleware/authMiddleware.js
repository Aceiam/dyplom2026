const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { JWT_SECRET } = require('../services/authService');

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

module.exports = authMiddleware;
