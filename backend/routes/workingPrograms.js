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
  updateWorkingProgram,
  deleteWorkingProgram,
} = require('../controllers/workingProgramController');

router.get('/template/default', getDefaultWorkingProgramData);
router.post('/', validateRequest(createWorkingProgramSchema), createWorkingProgram);
router.get('/', getWorkingPrograms);
router.get('/:id', validateRequest(idParamSchema, 'params'), getWorkingProgramById);
router.put(
  '/:id',
  validateRequest(idParamSchema, 'params'),
  validateRequest(updateWorkingProgramSchema),
  updateWorkingProgram,
);
router.delete('/:id', validateRequest(idParamSchema, 'params'), deleteWorkingProgram);

module.exports = router;
