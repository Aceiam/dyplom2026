const express = require('express');
require('dotenv').config();

const app = express();

// Дозволяє Express читати JSON з body у POST/PUT запитах.
app.use(express.json());

const documentRoutes = require('./routes/documents');
const teacherRoutes = require('./routes/teachers');
const workingProgramRoutes = require('./routes/workingPrograms');
const notFoundHandler = require('./middleware/notFoundHandler');
const errorHandler = require('./middleware/errorHandler');

// Старий модуль документів лишаємо як попередній етап розробки.
app.use('/documents', documentRoutes);
app.use('/teachers', teacherRoutes);
// Основний модуль дипломної: робочі програми навчальних дисциплін.
app.use('/working-programs', workingProgramRoutes);
// Обробники помилок мають бути після всіх routes.
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
