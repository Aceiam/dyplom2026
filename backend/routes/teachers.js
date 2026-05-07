const express = require('express');
const router = express.Router();

const {
  createTeacher,
  getTeachers
} = require('../controllers/teacherController');

// Довідник викладачів, які потім підтягуються у робочі програми.
router.post('/', createTeacher);
router.get('/', getTeachers);

module.exports = router;
