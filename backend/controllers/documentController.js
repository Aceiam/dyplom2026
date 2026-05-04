const pool = require('../db');

// CREATE
exports.createDocument = async (req, res) => {
  try {

    const { teacher_id, title, type, data } = req.body;

    let teacherSnapshot = null;

    if (teacher_id) {
      const teacherRes = await pool.query(
        'SELECT * FROM teachers WHERE id = $1',
        [teacher_id]
      );

      teacherSnapshot = teacherRes.rows[0];
    }

    let template = {};

    switch (type) {
      case 'practice':
        template = {
          name: 'Practice Report',
          sections: [
            'introduction',
            'task_description',
            'work_progress',
            'results',
            'conclusion'
          ]
        };
        break;

      case 'coursework':
        template = {
          name: 'Coursework',
          sections: [
            'introduction',
            'theoretical_part',
            'practical_part',
            'conclusion',
            'references'
          ]
        };
        break;

      case 'thesis':
        template = {
          name: 'Thesis',
          sections: [
            'abstract',
            'introduction',
            'analysis',
            'implementation',
            'results',
            'conclusion'
          ]
        };
        break;

      default:
        template = {
          name: 'Generic Document',
          sections: ['content']
        };
    }

    const finalData = {
      teacher: teacherSnapshot,
      student: data.student,
      content: data.content,
      template,
    };

    const result = await pool.query(
      `INSERT INTO documents (teacher_id, title, type, data)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
        [teacher_id, title, type, finalData]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// READ
exports.getDocuments = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM documents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// UPDATE
exports.updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, data } = req.body;
    // 1. Беремо існуючий документ
    const existing = await pool.query(
        'SELECT * FROM documents WHERE id = $1',
        [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const oldData = existing.rows[0].data;

    // 2. Безпечне оновлення (MERGE)
    const updatedData = {
      ...oldData,
      ...data
    };

    // 3. Оновлюємо тільки те, що дозволено
    const result = await pool.query(
        `UPDATE documents
       SET title = $1, data = $2
       WHERE id = $3
       RETURNING *`,
        [title, updatedData, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// DELETE
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM documents WHERE id = $1', [id]);

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json(err.message);
  }
};