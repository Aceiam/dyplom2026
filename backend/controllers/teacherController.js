const teacherService = require('../services/teacherService');
const asyncHandler = require('../utils/asyncHandler');

exports.createTeacher = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacher(req.body);
  res.status(201).json(teacher);
});

exports.getTeachers = asyncHandler(async (req, res) => {
  const teachers = await teacherService.getTeachers();
  res.json(teachers);
});
