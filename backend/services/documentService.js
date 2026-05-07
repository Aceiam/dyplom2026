const pool = require('../db');
const teacherService = require('./teacherService');
const AppError = require('../utils/AppError');

// Тимчасова система шаблонів для старого модуля documents.
const getTemplateByType = (type) => {
  switch (type) {
    case 'practice':
      return {
        name: 'Practice Report',
        sections: [
          'introduction',
          'task_description',
          'work_progress',
          'results',
          'conclusion',
        ],
      };

    case 'coursework':
      return {
        name: 'Coursework',
        sections: [
          'introduction',
          'theoretical_part',
          'practical_part',
          'conclusion',
          'references',
        ],
      };

    case 'thesis':
      return {
        name: 'Thesis',
        sections: [
          'abstract',
          'introduction',
          'analysis',
          'implementation',
          'results',
          'conclusion',
        ],
      };

    default:
      return {
        name: 'Generic Document',
        sections: ['content'],
      };
  }
};

const createDocument = async (payload) => {
  const {
    teacher_id,
    title,
    type,
    data = {},
  } = payload;

  const teacherSnapshot = teacher_id
    ? await teacherService.getTeacherById(teacher_id)
    : null;

  // Snapshot зберігає дані викладача в документі на момент створення.
  const finalData = {
    teacher: teacherSnapshot,
    student: data.student,
    content: data.content,
    template: getTemplateByType(type),
  };

  const result = await pool.query(
    `INSERT INTO documents (teacher_id, title, type, data)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [teacher_id, title, type, finalData],
  );

  return result.rows[0];
};

const getDocuments = async () => {
  const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
  return result.rows;
};

const getDocumentById = async (id) => {
  const result = await pool.query(
    'SELECT * FROM documents WHERE id = $1',
    [id],
  );

  if (result.rows.length === 0) {
    throw new AppError('Document not found', 404);
  }

  return result.rows[0];
};

const updateDocument = async (id, payload) => {
  const existing = await getDocumentById(id);
  // Для старих documents достатньо простого merge верхнього рівня.
  const updatedData = {
    ...existing.data,
    ...(payload.data || {}),
  };
  const title = payload.title ?? existing.title;

  const result = await pool.query(
    `UPDATE documents
     SET title = $1, data = $2
     WHERE id = $3
     RETURNING *`,
    [title, updatedData, id],
  );

  return result.rows[0];
};

const deleteDocument = async (id) => {
  const result = await pool.query(
    'DELETE FROM documents WHERE id = $1 RETURNING id',
    [id],
  );

  if (result.rows.length === 0) {
    throw new AppError('Document not found', 404);
  }

  return { message: 'Deleted' };
};

module.exports = {
  createDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
