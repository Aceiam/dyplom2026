const express = require('express');
const router = express.Router();

const {
  createTeacher,
  getTeachers
} = require('../controllers/teacherController');

router.post('/', createTeacher);
router.get('/', getTeachers);

module.exports = router;