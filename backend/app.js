const express = require('express');
require('dotenv').config();

const app = express();

app.use(express.json());

const documentRoutes = require('./routes/documents');
const teacherRoutes = require('./routes/teachers');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

app.use('/documents', documentRoutes);
app.use('/teachers', teacherRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
