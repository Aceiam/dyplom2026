const pool = require('../db');
const teacherService = require('./teacherService');
const AppError = require('../utils/AppError');
const deepMerge = require('../utils/deepMerge');
const buildWorkingProgramDefaultData = require('../templates/workingProgramDefaultData');

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const requireText = (payload, field) => {
  if (!payload[field] || typeof payload[field] !== 'string' || payload[field].trim() === '') {
    throw new AppError(`${field} is required`, 400);
  }

  return payload[field].trim();
};

const getTeacherSnapshot = async (teacherId) => {
  if (!teacherId) {
    return null;
  }

  return teacherService.getTeacherById(teacherId);
};

const buildProgramData = async (payload, existingData = null) => {
  const teacher = await getTeacherSnapshot(payload.teacher_id);
  const defaultData = buildWorkingProgramDefaultData(payload, teacher);
  const baseData = existingData || defaultData;
  const mergedData = deepMerge(baseData, payload.data || {});

  return {
    ...mergedData,
    teacherInfo: {
      ...(mergedData.teacherInfo || {}),
      primaryTeacher: teacher,
    },
  };
};

const getDefaultData = () => buildWorkingProgramDefaultData();

const createWorkingProgram = async (payload) => {
  const title = requireText(payload, 'title');
  const disciplineName = requireText(payload, 'discipline_name');
  const academicYear = requireText(payload, 'academic_year');

  const programPayload = {
    teacher_id: payload.teacher_id || null,
    title,
    discipline_name: disciplineName,
    academic_year: academicYear,
    specialty_code: payload.specialty_code || null,
    specialty_name: payload.specialty_name || null,
    educational_program: payload.educational_program || null,
    education_level: payload.education_level || null,
    data: payload.data || {},
  };

  const data = await buildProgramData(programPayload);

  const result = await pool.query(
    `INSERT INTO working_programs (
       teacher_id,
       title,
       discipline_name,
       academic_year,
       specialty_code,
       specialty_name,
       educational_program,
       education_level,
       data
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      programPayload.teacher_id,
      programPayload.title,
      programPayload.discipline_name,
      programPayload.academic_year,
      programPayload.specialty_code,
      programPayload.specialty_name,
      programPayload.educational_program,
      programPayload.education_level,
      data,
    ],
  );

  return result.rows[0];
};

const getWorkingPrograms = async () => {
  const result = await pool.query(
    `SELECT
       working_programs.*,
       teachers.full_name AS teacher_full_name
     FROM working_programs
     LEFT JOIN teachers ON teachers.id = working_programs.teacher_id
     ORDER BY working_programs.created_at DESC`,
  );

  return result.rows;
};

const getWorkingProgramById = async (id) => {
  const result = await pool.query(
    `SELECT
       working_programs.*,
       teachers.full_name AS teacher_full_name
     FROM working_programs
     LEFT JOIN teachers ON teachers.id = working_programs.teacher_id
     WHERE working_programs.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    throw new AppError('Working program not found', 404);
  }

  return result.rows[0];
};

const updateWorkingProgram = async (id, payload) => {
  const existing = await getWorkingProgramById(id);

  const nextPayload = {
    teacher_id: hasOwn(payload, 'teacher_id') ? payload.teacher_id : existing.teacher_id,
    title: hasOwn(payload, 'title') ? payload.title : existing.title,
    discipline_name: hasOwn(payload, 'discipline_name') ? payload.discipline_name : existing.discipline_name,
    academic_year: hasOwn(payload, 'academic_year') ? payload.academic_year : existing.academic_year,
    specialty_code: hasOwn(payload, 'specialty_code') ? payload.specialty_code : existing.specialty_code,
    specialty_name: hasOwn(payload, 'specialty_name') ? payload.specialty_name : existing.specialty_name,
    educational_program: hasOwn(payload, 'educational_program')
      ? payload.educational_program
      : existing.educational_program,
    education_level: hasOwn(payload, 'education_level') ? payload.education_level : existing.education_level,
    data: payload.data || {},
  };

  nextPayload.title = requireText(nextPayload, 'title');
  nextPayload.discipline_name = requireText(nextPayload, 'discipline_name');
  nextPayload.academic_year = requireText(nextPayload, 'academic_year');

  const data = await buildProgramData(nextPayload, existing.data || {});

  const result = await pool.query(
    `UPDATE working_programs
     SET
       teacher_id = $1,
       title = $2,
       discipline_name = $3,
       academic_year = $4,
       specialty_code = $5,
       specialty_name = $6,
       educational_program = $7,
       education_level = $8,
       data = $9,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $10
     RETURNING *`,
    [
      nextPayload.teacher_id,
      nextPayload.title,
      nextPayload.discipline_name,
      nextPayload.academic_year,
      nextPayload.specialty_code,
      nextPayload.specialty_name,
      nextPayload.educational_program,
      nextPayload.education_level,
      data,
      id,
    ],
  );

  return result.rows[0];
};

const deleteWorkingProgram = async (id) => {
  const result = await pool.query(
    'DELETE FROM working_programs WHERE id = $1 RETURNING id',
    [id],
  );

  if (result.rows.length === 0) {
    throw new AppError('Working program not found', 404);
  }

  return { message: 'Deleted' };
};

module.exports = {
  getDefaultData,
  createWorkingProgram,
  getWorkingPrograms,
  getWorkingProgramById,
  updateWorkingProgram,
  deleteWorkingProgram,
};
