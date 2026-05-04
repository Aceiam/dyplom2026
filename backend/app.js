const express = require('express');
require('dotenv').config();

const app = express();

app.use(express.json());

const documentRoutes = require('./routes/documents');
const teacherRoutes = require('./routes/teachers');

app.use('/documents', documentRoutes);
app.use('/teachers', teacherRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});