const Joi = require('joi');

const nullableText = Joi.string().trim().allow('', null);

const workingProgramDataSchema = Joi.object({
  meta: Joi.object().unknown(true),
  titlePage: Joi.object().unknown(true),
  approvalPage: Joi.object().unknown(true),
  teacherInfo: Joi.object().unknown(true),
  disciplineDescription: Joi.object().unknown(true),
  purposeAndTasks: Joi.object({
    subject: nullableText,
    purpose: nullableText,
    tasks: nullableText,
  }).unknown(true),
  learningOutcomes: Joi.array().items(Joi.object().unknown(true)),
  prerequisites: nullableText,
  postrequisites: nullableText,
  courseProgram: Joi.array().items(Joi.object().unknown(true)),
  thematicPlan: Joi.array().items(Joi.object().unknown(true)),
  labs: Joi.array().items(Joi.object().unknown(true)),
  selfStudy: Joi.object().unknown(true),
  assessment: Joi.object().unknown(true),
  examQuestions: Joi.object().unknown(true),
  literature: Joi.array().items(Joi.object().unknown(true)),
  informationResources: Joi.array().items(Joi.object().unknown(true)),
  teachingMethods: Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.object().unknown(true))),
  disciplinePolicy: nullableText,
}).unknown(false);

const createWorkingProgramSchema = Joi.object({
  teacher_id: Joi.number().integer().positive().allow(null),
  title: Joi.string().trim().min(3).required(),
  discipline_name: Joi.string().trim().min(3).required(),
  academic_year: Joi.string().trim().pattern(/^\d{4}-\d{4}$/).required()
    .messages({
      'string.pattern.base': 'academic_year must use YYYY-YYYY format',
    }),
  specialty_code: nullableText,
  specialty_name: nullableText,
  educational_program: nullableText,
  education_level: nullableText,
  data: workingProgramDataSchema.default({}),
}).unknown(false);

const updateWorkingProgramSchema = Joi.object({
  teacher_id: Joi.number().integer().positive().allow(null),
  title: Joi.string().trim().min(3),
  discipline_name: Joi.string().trim().min(3),
  academic_year: Joi.string().trim().pattern(/^\d{4}-\d{4}$/)
    .messages({
      'string.pattern.base': 'academic_year must use YYYY-YYYY format',
    }),
  specialty_code: nullableText,
  specialty_name: nullableText,
  educational_program: nullableText,
  education_level: nullableText,
  data: workingProgramDataSchema,
}).min(1).unknown(false);

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  createWorkingProgramSchema,
  updateWorkingProgramSchema,
  idParamSchema,
};
