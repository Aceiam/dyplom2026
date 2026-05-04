const pool = require('../db');

// CREATE
exports.createTeacher = async (req, res) => {
  try {
    const {
      full_name,
      degree,
      position,
      email
    } = req.body;

    const result = await pool.query(
      `INSERT INTO teachers (full_name, degree, position, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [full_name, degree, position, email]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// READ
exports.getTeachers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM teachers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err.message);
  }
};