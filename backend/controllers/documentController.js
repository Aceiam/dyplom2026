const documentService = require('../services/documentService');
const asyncHandler = require('../utils/asyncHandler');

// Controller тільки приймає HTTP-запит і передає роботу в service.
exports.createDocument = asyncHandler(async (req, res) => {
  const document = await documentService.createDocument(req.body);
  res.status(201).json(document);
});

exports.getDocuments = asyncHandler(async (req, res) => {
  const documents = await documentService.getDocuments();
  res.json(documents);
});

exports.updateDocument = asyncHandler(async (req, res) => {
  const document = await documentService.updateDocument(req.params.id, req.body);
  res.json(document);
});

exports.deleteDocument = asyncHandler(async (req, res) => {
  const result = await documentService.deleteDocument(req.params.id);
  res.json(result);
});
