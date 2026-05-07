const pool = require('../db');
const AppError = require('../utils/AppError');

// Service містить SQL-запити для таблиці teachers.
const createTeacher = async (payload) => {
  const {
    full_name,
    degree,
    position,
    email,
  } = payload;

  const result = await pool.query(
    `INSERT INTO teachers (full_name, degree, position, email)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [full_name, degree, position, email],
  );

  return result.rows[0];
};

const getTeachers = async () => {
  const result = await pool.query('SELECT * FROM teachers ORDER BY full_name ASC');
  return result.rows;
};

const getTeacherById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM teachers WHERE id = $1',
    [id],
  );

  if (result.rows.length === 0) {
    // Service сам визначає бізнес-помилку, controller лише повертає відповідь.
    throw new AppError('Teacher not found', 404);
  }

  return result.rows[0];
};

module.exports = {
  createTeacher,
  getTeachers,
  getTeacherById,
};
