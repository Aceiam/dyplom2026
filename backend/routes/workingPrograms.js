const express = require('express');
const router = express.Router();
const validateRequest = require('../middleware/validateRequest');
const {
  createWorkingProgramSchema,
  updateWorkingProgramSchema,
  idParamSchema,
} = require('../validators/workingProgramValidator');

const {
  getDefaultWorkingProgramData,
  createWorkingProgram,
  getWorkingPrograms,
  getWorkingProgramById,
  exportWorkingProgramPdf,
  updateWorkingProgram,
  deleteWorkingProgram,
} = require('../controllers/workingProgramController');

router.get('/template/default', getDefaultWorkingProgramData);
router.post('/', validateRequest(createWorkingProgramSchema), createWorkingProgram);
router.get('/', getWorkingPrograms);
// Цей route має бути перед /:id, інакше "pdf" буде сприйнято як частину id.
router.get('/:id/pdf', validateRequest(idParamSchema, 'params'), exportWorkingProgramPdf);
router.get('/:id', validateRequest(idParamSchema, 'params'), getWorkingProgramById);
router.put(
  '/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateWorkingProgramSchema),
  updateWorkingProgram,
);
router.delete('/:id', validateRequest(idParamSchema, 'params'), deleteWorkingProgram);

module.exports = router;
