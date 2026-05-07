const workingProgramService = require('../services/workingProgramService');
const asyncHandler = require('../utils/asyncHandler');

exports.getDefaultWorkingProgramData = asyncHandler(async (req, res) => {
  res.json(workingProgramService.getDefaultData());
});

exports.createWorkingProgram = asyncHandler(async (req, res) => {
  const workingProgram = await workingProgramService.createWorkingProgram(req.body);
  res.status(201).json(workingProgram);
});

exports.getWorkingPrograms = asyncHandler(async (req, res) => {
  const workingPrograms = await workingProgramService.getWorkingPrograms();
  res.json(workingPrograms);
});

exports.getWorkingProgramById = asyncHandler(async (req, res) => {
  const workingProgram = await workingProgramService.getWorkingProgramById(req.params.id);
  res.json(workingProgram);
});

exports.updateWorkingProgram = asyncHandler(async (req, res) => {
  const workingProgram = await workingProgramService.updateWorkingProgram(req.params.id, req.body);
  res.json(workingProgram);
});

exports.deleteWorkingProgram = asyncHandler(async (req, res) => {
  const result = await workingProgramService.deleteWorkingProgram(req.params.id);
  res.json(result);
});
