const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');
const AppError = require('../utils/AppError');

const workingProgramTemplateDir = path.join(__dirname, '..', 'templates', 'working-program');
const workingProgramTemplatePath = path.join(workingProgramTemplateDir, 'document.hbs');
const workingProgramStylesPath = path.join(workingProgramTemplateDir, 'styles.css');

// Puppeteer потрібен реальний браузер: спершу беремо шлях з env, потім типові шляхи Windows.
const browserExecutableCandidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const getBrowserExecutablePath = () => (
  browserExecutableCandidates.find((candidatePath) => fs.existsSync(candidatePath))
);

// Показує запасне значення замість порожніх/null полів у незаповненому документі.
Handlebars.registerHelper('value', (value, fallback = '') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
});

Handlebars.registerHelper('hasItems', (items) => Array.isArray(items) && items.length > 0);

Handlebars.registerHelper('inc', (value) => Number(value) + 1);

Handlebars.registerHelper('listValue', (value, fallback = '') => {
  if (Array.isArray(value)) {
    const items = value
      .filter((item) => item !== null && item !== undefined && item !== '')
      .map((item) => String(item));

    return items.length > 0 ? items.join(', ') : fallback;
  }

  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  return value;
});

// Робить шаблон простішим: {{purposeAndTasks.purpose}} замість довгих шляхів через data.
const buildWorkingProgramViewModel = (workingProgram) => {
  const data = workingProgram.data || {};

  return {
    ...workingProgram,
    data,
    titlePage: data.titlePage || {},
    approvalPage: data.approvalPage || {},
    teacherInfo: data.teacherInfo || {},
    disciplineDescription: data.disciplineDescription || {},
    purposeAndTasks: data.purposeAndTasks || {},
    learningOutcomes: data.learningOutcomes || [],
    courseProgram: data.courseProgram || [],
    thematicPlan: data.thematicPlan || [],
    labs: data.labs || [],
    selfStudy: data.selfStudy || {},
    assessment: data.assessment || {},
    examQuestions: data.examQuestions || {},
    literature: data.literature || [],
    informationResources: data.informationResources || [],
    teachingMethods: data.teachingMethods || [],
    disciplinePolicy: data.disciplinePolicy || '',
    prerequisites: data.prerequisites || '',
    postrequisites: data.postrequisites || '',
  };
};

// Об'єднує Handlebars HTML і CSS в один HTML-документ для друку.
const renderWorkingProgramHtml = (workingProgram) => {
  const template = fs.readFileSync(workingProgramTemplatePath, 'utf8');
  const styles = fs.readFileSync(workingProgramStylesPath, 'utf8');
  const compiledTemplate = Handlebars.compile(template);

  return compiledTemplate({
    ...buildWorkingProgramViewModel(workingProgram),
    styles,
  });
};

// Відкриває невидимий Chrome/Edge, рендерить HTML і друкує його як PDF A4.
const generatePdfFromHtml = async (html) => {
  const executablePath = getBrowserExecutablePath();

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  let browser;

  try {
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // networkidle0 чекає, поки сторінка завершить завантаження ресурсів.
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    return Buffer.from(pdf);
  } catch (error) {
    throw new AppError(
      'PDF generation failed. Check that Chrome, Edge, or Puppeteer browser is available.',
      500,
      [{ message: error.message }],
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Публічна функція для controller endpoint-а GET /working-programs/:id/pdf.
const generateWorkingProgramPdf = async (workingProgram) => {
  const html = renderWorkingProgramHtml(workingProgram);
  return generatePdfFromHtml(html);
};

module.exports = {
  renderWorkingProgramHtml,
  generateWorkingProgramPdf,
};
