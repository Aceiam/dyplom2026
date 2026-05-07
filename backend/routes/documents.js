const express = require('express');
const router = express.Router();

const {
  createDocument,
  getDocuments,
  updateDocument,
  deleteDocument
} = require('../controllers/documentController');

// Старий CRUD для універсальних документів. Не є головним модулем дипломної.
router.post('/', createDocument);
router.get('/', getDocuments);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
