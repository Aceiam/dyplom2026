const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const {
  registerSchema,
  loginSchema,
} = require('../validators/authValidator');
const {
  register,
  login,
  getMe,
  deleteMe,
} = require('../controllers/authController');

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/me', authMiddleware, getMe);
router.delete('/me', authMiddleware, deleteMe);

module.exports = router;
