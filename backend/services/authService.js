const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const AppError = require('../utils/AppError');

const PASSWORD_SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'dyplom2026-dev-secret-change-me';

const toPublicUser = (user) => ({
  id: user.id,
  teacher_id: user.teacher_id,
  full_name: user.full_name,
  email: user.email,
  role: user.role,
  is_active: user.is_active,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const assertChdtuEmail = (email) => {
  if (!normalizeEmail(email).endsWith('@chdtu.edu.ua')) {
    throw new AppError('Only @chdtu.edu.ua email addresses are allowed', 400);
  }
};

const signToken = (user, remember = false) => jwt.sign(
  {
    sub: user.id,
    email: user.email,
    role: user.role,
  },
  JWT_SECRET,
  {
    expiresIn: remember ? '30d' : '8h',
  },
);

const getUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email],
  );

  return result.rows[0] || null;
};

const getUserById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id],
  );

  return result.rows[0] || null;
};

const register = async ({ full_name, email, password, remember }) => {
  const normalizedEmail = normalizeEmail(email);
  assertChdtuEmail(normalizedEmail);

  const existingUser = await getUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError('User with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [full_name, normalizedEmail, passwordHash],
  );
  const user = result.rows[0];

  return {
    user: toPublicUser(user),
    token: signToken(user, remember),
  };
};

const login = async ({ email, password, remember }) => {
  const normalizedEmail = normalizeEmail(email);
  assertChdtuEmail(normalizedEmail);

  const user = await getUserByEmail(normalizedEmail);

  if (!user || !user.is_active) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  await pool.query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id],
  );

  return {
    user: toPublicUser(user),
    token: signToken(user, remember),
  };
};

const getMe = async (userId) => {
  const user = await getUserById(userId);

  if (!user || !user.is_active) {
    throw new AppError('User not found', 404);
  }

  return toPublicUser(user);
};

const deleteMe = async (userId) => {
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [userId],
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  return { message: 'Account deleted' };
};

module.exports = {
  JWT_SECRET,
  register,
  login,
  getMe,
  deleteMe,
};
