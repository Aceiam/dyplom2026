const workingProgramService = require('../services/workingProgramService');
const pdfService = require('../services/pdfService');
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

exports.exportWorkingProgramPdf = asyncHandler(async (req, res) => {
  const workingProgram = await workingProgramService.getWorkingProgramById(req.params.id);
  const pdf = await pdfService.generateWorkingProgramPdf(workingProgram);
  const filename = `working-program-${workingProgram.id}.pdf`;

  // inline дозволяє браузеру/Postman показати PDF без примусового завантаження.
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Length', pdf.length);
  res.send(pdf);
});

exports.updateWorkingProgram = asyncHandler(async (req, res) => {
  const workingProgram = await workingProgramService.updateWorkingProgram(req.params.id, req.body);
  res.json(workingProgram);
});

exports.deleteWorkingProgram = asyncHandler(async (req, res) => {
  const result = await workingProgramService.deleteWorkingProgram(req.params.id);
  res.json(result);
});
