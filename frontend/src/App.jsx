import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  ExternalLink,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers,
  Library,
  ListChecks,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  TableProperties,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { api, getPdfUrl, setAuthToken } from './api';

const clone = (value) => JSON.parse(JSON.stringify(value ?? {}));

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const getByPath = (object, path, fallback = '') => {
  const value = path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) {
      return undefined;
    }

    return current[key];
  }, object);

  return value === null || value === undefined ? fallback : value;
};

const setByPath = (object, path, value) => {
  const keys = path.split('.');
  const root = { ...(object || {}) };
  let cursor = root;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }

    cursor[key] = { ...(cursor[key] || {}) };
    cursor = cursor[key];
  });

  return root;
};

const toNumberOrNull = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const splitCsv = (value) => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const AUTH_TOKEN_KEY = 'dyplom2026.authToken';
const AUTH_STORAGE_KEY = 'dyplom2026.authStorage';

const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateAcademicYear = (value) => {
  if (isBlank(value)) {
    return 'Навчальний рік обовʼязковий.';
  }

  const match = String(value).trim().match(/^(\d{4})-(\d{4})$/);

  if (!match) {
    return 'Формат має бути YYYY-YYYY, наприклад 2025-2026.';
  }

  if (Number(match[2]) !== Number(match[1]) + 1) {
    return 'Другий рік має бути наступним після першого.';
  }

  return '';
};

const validateChdtuEmail = (value) => {
  if (isBlank(value)) {
    return 'Email обовʼязковий.';
  }

  const email = String(value).trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Вкажи коректний email.';
  }

  if (!email.endsWith('@chdtu.edu.ua')) {
    return 'Для реєстрації потрібна пошта @chdtu.edu.ua.';
  }

  return '';
};

const validateScoreRange = (value) => {
  if (isBlank(value)) {
    return '';
  }

  const match = String(value).trim().match(/^(\d{1,3})(?:-(\d{1,3}))?$/);

  if (!match) {
    return 'Вкажи число або діапазон, наприклад 90-100.';
  }

  const from = Number(match[1]);
  const to = match[2] ? Number(match[2]) : from;

  if (from < 0 || to > 100 || from > to) {
    return 'Бали мають бути в межах 0-100, від меншого до більшого.';
  }

  return '';
};

const getFieldValidation = ({ label, value, required = false, kind = 'text' }) => {
  const normalizedLabel = String(label || '').toLowerCase();

  if (required && isBlank(value)) {
    return 'Обовʼязкове поле.';
  }

  if (isBlank(value)) {
    return '';
  }

  if (normalizedLabel.includes('навчальний рік')) {
    return validateAcademicYear(value);
  }

  if (normalizedLabel.includes('email')) {
    if (normalizedLabel.includes('chdtu')) {
      const error = validateChdtuEmail(value);
      return error === 'Email обовʼязковий.' && !required ? '' : error;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
      ? ''
      : 'Вкажи коректний email, наприклад user@chdtu.edu.ua.';
  }

  if (
    normalizedLabel.includes('профайл')
    || normalizedLabel.includes('розклад')
    || normalizedLabel.includes('url')
  ) {
    return isHttpUrl(String(value).trim())
      ? ''
      : 'Посилання має починатися з http:// або https://.';
  }

  if (normalizedLabel.includes('семестри')) {
    return /^(\d+\s*,\s*)*\d+$/.test(String(value).trim())
      ? ''
      : 'Семестри вкажи через кому, наприклад 1, 2.';
  }

  if (normalizedLabel.includes('бали')) {
    return validateScoreRange(value);
  }

  if (kind === 'number') {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return 'Вкажи число.';
    }

    if (normalizedLabel === '№' && numericValue < 1) {
      return 'Номер має бути 1 або більше.';
    }

    if (numericValue < 0) {
      return 'Значення не може бути відʼємним.';
    }
  }

  if (required && String(value).trim().length < 3) {
    return 'Мінімум 3 символи.';
  }

  return '';
};

const getFieldHint = ({ label, required = false, kind = 'text' }) => {
  const normalizedLabel = String(label || '').toLowerCase();

  if (normalizedLabel.includes('навчальний рік')) {
    return 'Тип даних: навчальний рік у форматі YYYY-YYYY, наприклад 2025-2026.';
  }

  if (normalizedLabel.includes('email')) {
    return normalizedLabel.includes('chdtu')
      ? 'Тип даних: корпоративний email @chdtu.edu.ua.'
      : 'Тип даних: email, наприклад name@example.com.';
  }

  if (
    normalizedLabel.includes('профайл')
    || normalizedLabel.includes('розклад')
    || normalizedLabel.includes('url')
  ) {
    return 'Тип даних: URL-посилання з http:// або https://.';
  }

  if (normalizedLabel.includes('семестри')) {
    return 'Тип даних: список чисел через кому, наприклад 1, 2.';
  }

  if (normalizedLabel.includes('бали')) {
    return 'Тип даних: число або діапазон балів, наприклад 90-100.';
  }

  if (kind === 'number') {
    return 'Тип даних: число.';
  }

  if (required) {
    return 'Тип даних: текст. Обовʼязково для збереження.';
  }

  return 'Тип даних: текст.';
};

const getProgramValidationProblems = (program) => {
  if (!program) {
    return ['Програму ще не завантажено.'];
  }

  const problems = [];
  const addProblem = ({ label, value, required = false, kind = 'text' }) => {
    const error = getFieldValidation({ label, value, required, kind });

    if (error) {
      problems.push(`${label}: ${error}`);
    }
  };

  addProblem({ label: 'Назва документа', value: program.title, required: true });
  addProblem({ label: 'Назва дисципліни', value: program.discipline_name, required: true });
  addProblem({ label: 'Навчальний рік', value: program.academic_year, required: true });

  const data = program.data || {};
  addProblem({ label: 'Профайл дисципліни', value: getByPath(data, 'teacherInfo.disciplineProfileUrl') });
  addProblem({ label: 'Розклад консультацій', value: getByPath(data, 'teacherInfo.consultationScheduleUrl') });
  addProblem({ label: 'Семестри', value: ensureArray(getByPath(data, 'disciplineDescription.semesters', [])).join(', ') });

  [
    ['Кредити ЄКТС', getByPath(data, 'disciplineDescription.credits', '')],
    ['Загальна кількість годин', getByPath(data, 'disciplineDescription.totalHours', '')],
    ['Аудиторні години', getByPath(data, 'disciplineDescription.classroomHours', '')],
    ['Лекції, денна', getByPath(data, 'disciplineDescription.lecturesHours.fullTime', '')],
    ['Лекції, заочна', getByPath(data, 'disciplineDescription.lecturesHours.partTime', '')],
    ['Практичні, денна', getByPath(data, 'disciplineDescription.practicalHours.fullTime', '')],
    ['Практичні, заочна', getByPath(data, 'disciplineDescription.practicalHours.partTime', '')],
    ['Лабораторні, денна', getByPath(data, 'disciplineDescription.labHours.fullTime', '')],
    ['Лабораторні, заочна', getByPath(data, 'disciplineDescription.labHours.partTime', '')],
    ['Самостійна, денна', getByPath(data, 'disciplineDescription.selfStudyHours.fullTime', '')],
    ['Самостійна, заочна', getByPath(data, 'disciplineDescription.selfStudyHours.partTime', '')],
  ].forEach(([label, value]) => addProblem({ label, value, kind: 'number' }));

  ensureArray(getByPath(data, 'approvalPage.developers', [])).forEach((developer, index) => {
    addProblem({ label: `Email розробника ${index + 1}`, value: developer?.email || '' });
  });

  ensureArray(getByPath(data, 'thematicPlan', [])).forEach((item, index) => {
    addProblem({ label: `№ теми ${index + 1}`, value: item?.number ?? '', kind: 'number' });
    addProblem({ label: `Лекції теми ${index + 1}`, value: item?.lectures ?? '', kind: 'number' });
    addProblem({ label: `Лабораторні теми ${index + 1}`, value: item?.labs ?? '', kind: 'number' });
    addProblem({ label: `Самостійна теми ${index + 1}`, value: item?.selfStudy ?? '', kind: 'number' });
  });

  ensureArray(getByPath(data, 'labs', [])).forEach((lab, index) => {
    addProblem({ label: `Години лабораторної ${index + 1}`, value: lab?.hours ?? '', kind: 'number' });
  });

  ensureArray(getByPath(data, 'assessment.scale', [])).forEach((scaleItem, index) => {
    addProblem({ label: `Бали шкали ${index + 1}`, value: scaleItem?.points || '' });
  });

  return problems;
};

const readStoredAuth = () => {
  const preferredStorage = localStorage.getItem(AUTH_STORAGE_KEY);
  const localToken = localStorage.getItem(AUTH_TOKEN_KEY);
  const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY);

  if (preferredStorage === 'local' && localToken) {
    return { token: localToken, remember: true };
  }

  if (sessionToken) {
    return { token: sessionToken, remember: false };
  }

  if (localToken) {
    return { token: localToken, remember: true };
  }

  return { token: '', remember: false };
};

const persistAuth = (token, remember) => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);

  if (remember) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_STORAGE_KEY, 'local');
  } else {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_STORAGE_KEY, 'session');
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
};

const normalizeProgram = (program = {}) => ({
  id: program.id ?? null,
  teacher_id: program.teacher_id ?? null,
  title: program.title ?? '',
  discipline_name: program.discipline_name ?? '',
  academic_year: program.academic_year ?? '',
  specialty_code: program.specialty_code ?? '',
  specialty_name: program.specialty_name ?? '',
  educational_program: program.educational_program ?? '',
  education_level: program.education_level ?? '',
  teacher_full_name: program.teacher_full_name ?? '',
  data: program.data ?? {},
});

const emptyProgram = (template, teachers) => normalizeProgram({
  teacher_id: teachers[0]?.id ?? null,
  title: 'Нова робоча програма',
  discipline_name: 'Нова навчальна дисципліна',
  academic_year: '2025-2026',
  specialty_code: '',
  specialty_name: '',
  educational_program: '',
  education_level: 'бакалаврський',
  data: clone(template),
});

const sections = [
  { id: 'general', title: 'Загальне', icon: FileText },
  { id: 'title', title: 'Титул', icon: ClipboardList },
  { id: 'approval', title: 'Погодження', icon: UserRound },
  { id: 'teacher', title: 'Викладач', icon: GraduationCap },
  { id: 'description', title: 'Опис', icon: TableProperties },
  { id: 'purpose', title: 'Мета і результати', icon: ListChecks },
  { id: 'course', title: 'Програма', icon: Layers },
  { id: 'plan', title: 'Тематичний план', icon: TableProperties },
  { id: 'labs', title: 'Лабораторні', icon: FlaskConical },
  { id: 'selfStudy', title: 'Самостійна', icon: BookOpen },
  { id: 'assessment', title: 'Оцінювання', icon: ListChecks },
  { id: 'exam', title: 'Питання', icon: ClipboardList },
  { id: 'references', title: 'Ресурси', icon: Library },
];

function App() {
  const [programs, setPrograms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [template, setTemplate] = useState({});
  const [editor, setEditor] = useState(null);
  const [activeSection, setActiveSection] = useState('general');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [teacherDrawerOpen, setTeacherDrawerOpen] = useState(false);
  const [teacherSaving, setTeacherSaving] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authSaving, setAuthSaving] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthTokenState] = useState('');
  const [authDraft, setAuthDraft] = useState({
    full_name: '',
    email: '',
    password: '',
    remember: true,
  });
  const [teacherDraft, setTeacherDraft] = useState({
    full_name: '',
    degree: '',
    position: '',
    email: '',
  });

  useEffect(() => {
    const storedAuth = readStoredAuth();

    if (storedAuth.token) {
      setAuthTokenState(storedAuth.token);
      setAuthToken(storedAuth.token);
      restoreSession(storedAuth.token);
    } else {
      setAuthModalOpen(true);
    }

    loadInitialData();
  }, []);

  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return programs;
    }

    return programs.filter((program) => [
      program.title,
      program.discipline_name,
      program.academic_year,
      program.specialty_name,
      program.teacher_full_name,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)));
  }, [programs, query]);

  const selectedSection = sections.find((section) => section.id === activeSection) || sections[0];
  const SelectedSectionIcon = selectedSection.icon;

  async function loadInitialData() {
    setLoading(true);
    setNotice(null);

    try {
      const [programList, teacherList, defaultTemplate] = await Promise.all([
        api.getWorkingPrograms(),
        api.getTeachers(),
        api.getDefaultTemplate(),
      ]);

      setPrograms(programList);
      setTeachers(teacherList);
      setTemplate(defaultTemplate);

      if (programList.length > 0) {
        const firstProgram = await api.getWorkingProgram(programList[0].id);
        setEditor(normalizeProgram(firstProgram));
      } else {
        setEditor(emptyProgram(defaultTemplate, teacherList));
      }
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Не вдалося завантажити дані.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function restoreSession(token) {
    try {
      setAuthToken(token);
      const user = await api.getMe();
      setAuthUser(user);
      setAuthModalOpen(false);
    } catch {
      clearStoredAuth();
      setAuthToken('');
      setAuthTokenState('');
      setAuthUser(null);
      setAuthModalOpen(true);
      setNotice({
        type: 'info',
        text: 'Сесія завершилась. Увійди ще раз.',
      });
    }
  }

  function openAuth(mode = 'login') {
    setAuthMode(mode);
    setAuthModalOpen(true);
  }

  function setAuthDraftField(field, value) {
    setAuthDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateAuthDraft() {
    const problems = [];
    const emailError = validateChdtuEmail(authDraft.email);

    if (emailError) {
      problems.push(`Email: ${emailError}`);
    }

    if (authMode === 'register' && isBlank(authDraft.full_name)) {
      problems.push('ПІБ: обовʼязкове поле.');
    }

    if (authMode === 'register' && String(authDraft.full_name || '').trim().length > 0 && String(authDraft.full_name).trim().length < 3) {
      problems.push('ПІБ: мінімум 3 символи.');
    }

    if (String(authDraft.password || '').length < 8) {
      problems.push('Пароль: мінімум 8 символів.');
    }

    return problems;
  }

  async function submitAuth() {
    const problems = validateAuthDraft();

    if (problems.length > 0) {
      setNotice({
        type: 'error',
        text: `Виправ дані входу: ${problems.slice(0, 3).join('; ')}`,
      });
      return;
    }

    setAuthSaving(true);
    setNotice(null);

    try {
      const payload = {
        email: authDraft.email.trim().toLowerCase(),
        password: authDraft.password,
        remember: Boolean(authDraft.remember),
      };
      const result = authMode === 'register'
        ? await api.register({ ...payload, full_name: authDraft.full_name.trim() })
        : await api.login(payload);

      persistAuth(result.token, Boolean(authDraft.remember));
      setAuthToken(result.token);
      setAuthTokenState(result.token);
      setAuthUser(result.user);
      setAuthModalOpen(false);
      setAuthDraft((current) => ({
        ...current,
        password: '',
      }));
      setNotice({
        type: 'success',
        text: authMode === 'register' ? 'Акаунт створено. Вхід виконано.' : 'Вхід виконано.',
      });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Не вдалося виконати авторизацію.',
      });
    } finally {
      setAuthSaving(false);
    }
  }

  function logout() {
    clearStoredAuth();
    setAuthToken('');
    setAuthTokenState('');
    setAuthUser(null);
    setAuthDraft((current) => ({
      ...current,
      password: '',
    }));
    setAuthMode('login');
    setAuthModalOpen(true);
    setNotice({ type: 'info', text: 'Ти вийшов з акаунта.' });
  }

  async function deleteSelf() {
    if (!authToken || !window.confirm('Видалити свій акаунт? Цю дію не можна скасувати.')) {
      return;
    }

    setAuthSaving(true);
    setNotice(null);

    try {
      await api.deleteMe();
      clearStoredAuth();
      setAuthToken('');
      setAuthTokenState('');
      setAuthUser(null);
      setAuthMode('register');
      setAuthModalOpen(true);
      setNotice({ type: 'success', text: 'Акаунт видалено.' });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Не вдалося видалити акаунт.',
      });
    } finally {
      setAuthSaving(false);
    }
  }

  async function openProgram(id) {
    setEditorLoading(true);
    setNotice(null);

    try {
      const program = await api.getWorkingProgram(id);
      setEditor(normalizeProgram(program));
      setActiveSection('general');
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Не вдалося відкрити програму.',
      });
    } finally {
      setEditorLoading(false);
    }
  }

  function createNewProgram() {
    setEditor(emptyProgram(template, teachers));
    setActiveSection('general');
    setNotice({
      type: 'info',
      text: 'Створено чернетку. Заповни основні поля і натисни "Зберегти".',
    });
  }

  function setTopField(field, value) {
    setEditor((current) => {
      if (!current) {
        return current;
      }

      if (field !== 'teacher_id') {
        return { ...current, [field]: value };
      }

      const selectedTeacher = teachers.find((teacherItem) => Number(teacherItem.id) === Number(value));

      return {
        ...current,
        teacher_id: value || null,
        teacher_full_name: selectedTeacher?.full_name || '',
        data: setByPath(current.data, 'teacherInfo.primaryTeacher', selectedTeacher || null),
      };
    });
  }

  function setDataField(path, valueOrUpdater) {
    setEditor((current) => {
      const currentValue = getByPath(current.data, path, undefined);
      const nextValue = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(currentValue)
        : valueOrUpdater;

      return {
        ...current,
        data: setByPath(current.data, path, nextValue),
      };
    });
  }

  function updateArrayItem(path, index, updater) {
    setDataField(path, (currentValue) => {
      const next = [...ensureArray(currentValue)];
      next[index] = typeof updater === 'function' ? updater(next[index]) : updater;
      return next;
    });
  }

  function updateObjectItemField(path, index, field, value) {
    if (field === null) {
      updateArrayItem(path, index, value);
      return;
    }

    updateArrayItem(path, index, (item) => ({
      ...(item || {}),
      [field]: value,
    }));
  }

  function addArrayItem(path, item) {
    setDataField(path, (currentValue) => [...ensureArray(currentValue), item]);
  }

  function removeArrayItem(path, index) {
    setDataField(path, (currentValue) => ensureArray(currentValue).filter((_, itemIndex) => itemIndex !== index));
  }

  function updateModuleField(index, field, value) {
    updateObjectItemField('courseProgram', index, field, value);
  }

  function addModuleTopic(moduleIndex) {
    setDataField('courseProgram', (currentValue) => {
      const modules = [...ensureArray(currentValue)];
      const module = { ...(modules[moduleIndex] || {}) };
      module.topics = [
        ...ensureArray(module.topics),
        { title: '', description: '' },
      ];
      modules[moduleIndex] = module;
      return modules;
    });
  }

  function updateModuleTopic(moduleIndex, topicIndex, field, value) {
    setDataField('courseProgram', (currentValue) => {
      const modules = [...ensureArray(currentValue)];
      const module = { ...(modules[moduleIndex] || {}) };
      const topics = [...ensureArray(module.topics)];
      topics[topicIndex] = {
        ...(topics[topicIndex] || {}),
        [field]: value,
      };
      module.topics = topics;
      modules[moduleIndex] = module;
      return modules;
    });
  }

  function removeModuleTopic(moduleIndex, topicIndex) {
    setDataField('courseProgram', (currentValue) => {
      const modules = [...ensureArray(currentValue)];
      const module = { ...(modules[moduleIndex] || {}) };
      module.topics = ensureArray(module.topics).filter((_, index) => index !== topicIndex);
      modules[moduleIndex] = module;
      return modules;
    });
  }

  function buildPayload() {
    return {
      teacher_id: editor.teacher_id ? Number(editor.teacher_id) : null,
      title: editor.title.trim(),
      discipline_name: editor.discipline_name.trim(),
      academic_year: editor.academic_year.trim(),
      specialty_code: editor.specialty_code || null,
      specialty_name: editor.specialty_name || null,
      educational_program: editor.educational_program || null,
      education_level: editor.education_level || null,
      data: editor.data || {},
    };
  }

  function setTeacherDraftField(field, value) {
    setTeacherDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function createTeacher() {
    const problems = [
      ['ПІБ викладача', teacherDraft.full_name, true],
      ['Email', teacherDraft.email, false],
    ].reduce((items, [label, value, required]) => {
      const error = getFieldValidation({ label, value, required });
      return error ? [...items, `${label}: ${error}`] : items;
    }, []);

    if (problems.length > 0) {
      setNotice({
        type: 'error',
        text: `Виправ дані викладача: ${problems.join('; ')}`,
      });
      return;
    }

    setTeacherSaving(true);
    setNotice(null);

    try {
      const createdTeacher = await api.createTeacher({
        full_name: teacherDraft.full_name.trim(),
        degree: teacherDraft.degree.trim() || null,
        position: teacherDraft.position.trim() || null,
        email: teacherDraft.email.trim() || null,
      });
      const refreshedTeachers = await api.getTeachers();

      setTeachers(refreshedTeachers);
      setTopField('teacher_id', createdTeacher.id);
      setTeacherDraft({
        full_name: '',
        degree: '',
        position: '',
        email: '',
      });
      setTeacherDrawerOpen(false);
      setNotice({ type: 'success', text: 'Викладача додано і вибрано для поточної програми.' });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Не вдалося додати викладача.',
      });
    } finally {
      setTeacherSaving(false);
    }
  }

  async function saveProgram() {
    if (!editor) {
      return;
    }

    const payload = buildPayload();
    const validationProblems = getProgramValidationProblems(editor);

    if (validationProblems.length > 0) {
      setNotice({
        type: 'error',
        text: `Виправ поля перед збереженням: ${validationProblems.slice(0, 3).join('; ')}`,
      });
      return;
    }

    setSaving(true);
    setNotice(null);

    try {
      const saved = editor.id
        ? await api.updateWorkingProgram(editor.id, payload)
        : await api.createWorkingProgram(payload);

      const normalized = normalizeProgram(saved);
      setEditor(normalized);

      const refreshedPrograms = await api.getWorkingPrograms();
      setPrograms(refreshedPrograms);
      setNotice({ type: 'success', text: 'Робочу програму збережено.' });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Не вдалося зберегти програму.',
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteProgram(id) {
    if (!id || !window.confirm('Видалити цю робочу програму?')) {
      return;
    }

    setNotice(null);

    try {
      await api.deleteWorkingProgram(id);
      const refreshedPrograms = await api.getWorkingPrograms();
      setPrograms(refreshedPrograms);

      if (refreshedPrograms.length > 0) {
        await openProgram(refreshedPrograms[0].id);
      } else {
        setEditor(emptyProgram(template, teachers));
      }

      setNotice({ type: 'success', text: 'Робочу програму видалено.' });
    } catch (error) {
      setNotice({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Не вдалося видалити програму.',
      });
    }
  }

  function openPdf() {
    if (!editor?.id) {
      setNotice({ type: 'info', text: 'Спочатку збережи програму, потім можна відкривати PDF.' });
      return;
    }

    window.open(getPdfUrl(editor.id), '_blank', 'noopener,noreferrer');
  }

  const formApi = {
    editor,
    teachers,
    setTopField,
    setDataField,
    updateObjectItemField,
    addArrayItem,
    removeArrayItem,
    updateModuleField,
    addModuleTopic,
    updateModuleTopic,
    removeModuleTopic,
    openTeacherDrawer: () => setTeacherDrawerOpen(true),
  };

  return (
    <div className="app-shell">
      <aside className="program-sidebar">
        <div className="brand-block">
          <div className="brand-mark">РП</div>
          <div>
            <strong>Робочі програми</strong>
            <span>ЧДТУ</span>
          </div>
        </div>

        <div className="sidebar-actions">
          <button type="button" className="primary-button" onClick={createNewProgram}>
            <Plus size={17} />
            Нова
          </button>
          <button type="button" className="icon-button" onClick={loadInitialData} title="Оновити список">
            <RefreshCw size={18} />
          </button>
        </div>

        <button
          type="button"
          className="secondary-button full-width"
          onClick={() => setTeacherDrawerOpen(true)}
        >
          <UserRound size={17} />
          Додати викладача
        </button>

        <label className="search-field">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Пошук"
          />
        </label>

        <div className="program-list">
          {loading ? (
            <div className="empty-state">
              <LoaderCircle className="spin" size={18} />
              Завантаження...
            </div>
          ) : filteredPrograms.length > 0 ? (
            filteredPrograms.map((program) => (
              <button
                type="button"
                key={program.id}
                className={`program-list-item ${editor?.id === program.id ? 'active' : ''}`}
                onClick={() => openProgram(program.id)}
              >
                <span>{program.discipline_name || program.title}</span>
                <small>{program.academic_year || 'без року'} · {program.specialty_code || 'без спеціальності'}</small>
              </button>
            ))
          ) : (
            <div className="empty-state">Програм поки немає</div>
          )}
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Редактор PDF-документа</p>
            <h1>{editor?.discipline_name || 'Нова робоча програма'}</h1>
            <p className="subtitle">
              {editor?.academic_year || '2025-2026'} · {editor?.specialty_code || 'спеціальність не вказана'}
            </p>
          </div>

          <div className="topbar-actions">
            <div className="user-chip">
              <ShieldCheck size={16} />
              <div>
                <strong>{authUser?.full_name || 'Гість'}</strong>
                <span>{authUser?.email || 'потрібен вхід'}</span>
              </div>
            </div>
            {authUser ? (
              <>
                <button type="button" className="secondary-button" onClick={logout}>
                  Вийти
                </button>
                <button
                  type="button"
                  className="danger-icon-button"
                  onClick={deleteSelf}
                  title="Видалити свій акаунт"
                  disabled={authSaving}
                >
                  <Trash2 size={18} />
                </button>
              </>
            ) : (
              <button type="button" className="secondary-button" onClick={() => openAuth('login')}>
                Увійти
              </button>
            )}
            <button type="button" className="secondary-button" onClick={openPdf}>
              <ExternalLink size={17} />
              PDF
            </button>
            <button type="button" className="primary-button" onClick={saveProgram} disabled={saving || editorLoading}>
              {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
              Зберегти
            </button>
            {editor?.id && (
              <button
                type="button"
                className="danger-icon-button"
                onClick={() => deleteProgram(editor.id)}
                title="Видалити програму"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </header>

        {notice && (
          <div className={`notice ${notice.type}`}>
            {notice.text}
          </div>
        )}

        <div className="editor-layout">
          <nav className="section-nav">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  type="button"
                  key={section.id}
                  className={activeSection === section.id ? 'active' : ''}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={17} />
                  {section.title}
                </button>
              );
            })}
          </nav>

          <section className="editor-panel">
            {editorLoading || !editor ? (
              <div className="empty-state large">
                <LoaderCircle className="spin" size={22} />
                Завантаження редактора...
              </div>
            ) : (
              <>
                <div className="section-heading">
                  <SelectedSectionIcon size={21} />
                  <div>
                    <h2>{selectedSection.title}</h2>
                    <p>{sectionHint(activeSection)}</p>
                  </div>
                </div>
                <SectionRenderer section={activeSection} api={formApi} />
              </>
            )}
          </section>
        </div>
      </main>

      <TeacherDrawer
        open={teacherDrawerOpen}
        draft={teacherDraft}
        saving={teacherSaving}
        onClose={() => setTeacherDrawerOpen(false)}
        onChange={setTeacherDraftField}
        onSubmit={createTeacher}
      />
      <AuthModal
        open={authModalOpen}
        mode={authMode}
        draft={authDraft}
        saving={authSaving}
        onChange={setAuthDraftField}
        onModeChange={setAuthMode}
        onClose={() => authUser && setAuthModalOpen(false)}
        onSubmit={submitAuth}
      />
    </div>
  );
}

function AuthModal({
  open,
  mode,
  draft,
  saving,
  onChange,
  onModeChange,
  onClose,
  onSubmit,
}) {
  if (!open) {
    return null;
  }

  const isRegister = mode === 'register';

  return (
    <div className="auth-layer">
      <div className="auth-dialog" role="dialog" aria-modal="true">
        <div className="auth-header">
          <div>
            <p className="eyebrow">Акаунт ЧДТУ</p>
            <h2>{isRegister ? 'Реєстрація' : 'Вхід'}</h2>
            <p>Потрібна корпоративна пошта з доменом @chdtu.edu.ua.</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Закрити">
            <X size={18} />
          </button>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => onModeChange('login')}
          >
            Вхід
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => onModeChange('register')}
          >
            Реєстрація
          </button>
        </div>

        <form
          className="auth-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="auth-body">
          {isRegister && (
            <TextField
              label="ПІБ користувача"
              value={draft.full_name}
              onChange={(value) => onChange('full_name', value)}
              autoComplete="name"
              required
            />
          )}
          <TextField
            label="Email ЧДТУ"
            value={draft.email}
            onChange={(value) => onChange('email', value)}
            placeholder="name@chdtu.edu.ua"
            autoComplete="email"
            required
          />
          <PasswordField
            label="Пароль"
            value={draft.password}
            onChange={(value) => onChange('password', value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            required
          />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(draft.remember)}
              onChange={(event) => onChange('remember', event.target.checked)}
            />
            <span>Запамʼятати мене на цьому компʼютері</span>
          </label>
          </div>

          <div className="auth-footer">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />}
              {isRegister ? 'Зареєструватися' : 'Увійти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeacherDrawer({ open, draft, saving, onClose, onChange, onSubmit }) {
  return (
    <div className={`drawer-layer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <button type="button" className="drawer-backdrop" onClick={onClose} tabIndex={open ? 0 : -1}>
        <span>Закрити</span>
      </button>
      <aside className="teacher-drawer">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Довідник викладачів</p>
            <h2>Новий викладач</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} title="Закрити">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <TextField
            label="ПІБ викладача"
            value={draft.full_name}
            onChange={(value) => onChange('full_name', value)}
            required
          />
          <TextField
            label="Науковий ступінь"
            value={draft.degree}
            onChange={(value) => onChange('degree', value)}
            placeholder="к.ф.-м.н."
          />
          <TextField
            label="Посада"
            value={draft.position}
            onChange={(value) => onChange('position', value)}
            placeholder="доцент"
          />
          <TextField
            label="Email"
            value={draft.email}
            onChange={(value) => onChange('email', value)}
            placeholder="name@chdtu.edu.ua"
          />
        </div>

        <div className="drawer-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Скасувати
          </button>
          <button type="button" className="primary-button" onClick={onSubmit} disabled={saving}>
            {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            Зберегти викладача
          </button>
        </div>
      </aside>
    </div>
  );
}

function SectionRenderer({ section, api: formApi }) {
  switch (section) {
    case 'general':
      return <GeneralSection {...formApi} />;
    case 'title':
      return <TitlePageSection {...formApi} />;
    case 'approval':
      return <ApprovalSection {...formApi} />;
    case 'teacher':
      return <TeacherSection {...formApi} />;
    case 'description':
      return <DescriptionSection {...formApi} />;
    case 'purpose':
      return <PurposeSection {...formApi} />;
    case 'course':
      return <CourseProgramSection {...formApi} />;
    case 'plan':
      return <ThematicPlanSection {...formApi} />;
    case 'labs':
      return <LabsSection {...formApi} />;
    case 'selfStudy':
      return <SelfStudySection {...formApi} />;
    case 'assessment':
      return <AssessmentSection {...formApi} />;
    case 'exam':
      return <ExamSection {...formApi} />;
    case 'references':
      return <ReferencesSection {...formApi} />;
    default:
      return null;
  }
}

function sectionHint(section) {
  const hints = {
    general: 'Поля верхнього рівня використовуються у списку, пошуку і PDF.',
    title: 'Дані першої сторінки робочої програми.',
    approval: 'Розробники, протоколи кафедри, методична комісія і пролонгація.',
    teacher: 'Вибір викладача документа, контакти та посилання для PDF.',
    description: 'Табличний опис дисципліни: курс, семестри, кредити, години, контроль.',
    purpose: 'Мета, завдання, результати навчання, пре- та постреквізити.',
    course: 'Змістові модулі та теми програми дисципліни.',
    plan: 'Рядки таблиці тематичного плану з годинами та ресурсами.',
    labs: 'Перелік лабораторних робіт і кількість годин.',
    selfStudy: 'Теми, рекомендації та методичне забезпечення самостійної роботи.',
    assessment: 'Методи контролю, критерії та шкала оцінювання.',
    exam: 'Питання до підсумкового контролю або іспиту.',
    references: 'Література, інформаційні ресурси, методи навчання і політика дисципліни.',
  };

  return hints[section] || '';
}

function GeneralSection({ editor, teachers, setTopField }) {
  return (
    <div className="form-grid">
      <TextField label="Назва документа" value={editor.title} onChange={(value) => setTopField('title', value)} required />
      <TextField label="Назва дисципліни" value={editor.discipline_name} onChange={(value) => setTopField('discipline_name', value)} required />
      <TextField label="Навчальний рік" value={editor.academic_year} onChange={(value) => setTopField('academic_year', value)} placeholder="2025-2026" required />
      <SelectField
        label="Викладач"
        value={editor.teacher_id || ''}
        onChange={(value) => setTopField('teacher_id', value ? Number(value) : null)}
        options={[
          { value: '', label: 'Не обрано' },
          ...teachers.map((teacher) => ({ value: teacher.id, label: teacher.full_name })),
        ]}
      />
      <TextField label="Код спеціальності" value={editor.specialty_code} onChange={(value) => setTopField('specialty_code', value)} />
      <TextField label="Спеціальність" value={editor.specialty_name} onChange={(value) => setTopField('specialty_name', value)} />
      <TextField label="Освітня програма" value={editor.educational_program} onChange={(value) => setTopField('educational_program', value)} />
      <TextField label="Освітній рівень" value={editor.education_level} onChange={(value) => setTopField('education_level', value)} />
    </div>
  );
}

function TitlePageSection({ editor, setDataField }) {
  const data = editor.data;

  return (
    <>
      <div className="form-grid">
        <TextField label="Університет" value={getByPath(data, 'titlePage.university')} onChange={(value) => setDataField('titlePage.university', value)} />
        <TextField label="Факультет" value={getByPath(data, 'titlePage.faculty')} onChange={(value) => setDataField('titlePage.faculty', value)} />
        <TextField label="Кафедра" value={getByPath(data, 'titlePage.department')} onChange={(value) => setDataField('titlePage.department', value)} />
        <TextField label="Шифр за ОПП" value={getByPath(data, 'titlePage.programCode')} onChange={(value) => setDataField('titlePage.programCode', value)} />
      </div>

      <Subheading title="Затвердження" />
      <div className="form-grid">
        <TextField label="Посада" value={getByPath(data, 'titlePage.approval.approverPosition')} onChange={(value) => setDataField('titlePage.approval.approverPosition', value)} />
        <TextField label="ПІБ" value={getByPath(data, 'titlePage.approval.approverName')} onChange={(value) => setDataField('titlePage.approval.approverName', value)} />
        <TextField label="Номер протоколу" value={getByPath(data, 'titlePage.approval.protocolNumber')} onChange={(value) => setDataField('titlePage.approval.protocolNumber', value)} />
        <TextField label="Дата протоколу" value={getByPath(data, 'titlePage.approval.protocolDate')} onChange={(value) => setDataField('titlePage.approval.protocolDate', value)} />
      </div>
    </>
  );
}

function ApprovalSection({ editor, setDataField, updateObjectItemField, addArrayItem, removeArrayItem }) {
  const data = editor.data;
  const developers = ensureArray(getByPath(data, 'approvalPage.developers', []));

  return (
    <>
      <TextareaField
        label="Опис документа"
        value={getByPath(data, 'approvalPage.documentDescription')}
        onChange={(value) => setDataField('approvalPage.documentDescription', value)}
        rows={4}
      />

      <Subheading title="Розробники" />
      <ObjectList
        items={developers}
        addLabel="Додати розробника"
        onAdd={() => addArrayItem('approvalPage.developers', { full_name: '', degree: '', position: '', email: '' })}
        onRemove={(index) => removeArrayItem('approvalPage.developers', index)}
        renderItem={(developer, index) => (
          <div className="form-grid compact">
            <TextField label="ПІБ" value={developer.full_name || ''} onChange={(value) => updateObjectItemField('approvalPage.developers', index, 'full_name', value)} />
            <TextField label="Ступінь" value={developer.degree || ''} onChange={(value) => updateObjectItemField('approvalPage.developers', index, 'degree', value)} />
            <TextField label="Посада" value={developer.position || ''} onChange={(value) => updateObjectItemField('approvalPage.developers', index, 'position', value)} />
            <TextField label="Email" value={developer.email || ''} onChange={(value) => updateObjectItemField('approvalPage.developers', index, 'email', value)} />
          </div>
        )}
      />

      <Subheading title="Кафедра" />
      <div className="form-grid">
        <TextField label="Назва кафедри" value={getByPath(data, 'approvalPage.departmentApproval.departmentName')} onChange={(value) => setDataField('approvalPage.departmentApproval.departmentName', value)} />
        <TextField label="Номер протоколу" value={getByPath(data, 'approvalPage.departmentApproval.protocolNumber')} onChange={(value) => setDataField('approvalPage.departmentApproval.protocolNumber', value)} />
        <TextField label="Дата протоколу" value={getByPath(data, 'approvalPage.departmentApproval.protocolDate')} onChange={(value) => setDataField('approvalPage.departmentApproval.protocolDate', value)} />
        <TextField label="Завідувач кафедри" value={getByPath(data, 'approvalPage.departmentApproval.headName')} onChange={(value) => setDataField('approvalPage.departmentApproval.headName', value)} />
      </div>

      <Subheading title="Методична комісія та навчальний відділ" />
      <div className="form-grid">
        <TextField label="Протокол комісії" value={getByPath(data, 'approvalPage.facultyMethodicalCommission.protocolNumber')} onChange={(value) => setDataField('approvalPage.facultyMethodicalCommission.protocolNumber', value)} />
        <TextField label="Дата комісії" value={getByPath(data, 'approvalPage.facultyMethodicalCommission.protocolDate')} onChange={(value) => setDataField('approvalPage.facultyMethodicalCommission.protocolDate', value)} />
        <TextField label="Голова комісії" value={getByPath(data, 'approvalPage.facultyMethodicalCommission.headName')} onChange={(value) => setDataField('approvalPage.facultyMethodicalCommission.headName', value)} />
        <TextField label="Погодив навчальний відділ" value={getByPath(data, 'approvalPage.educationDepartmentApproval.approverName')} onChange={(value) => setDataField('approvalPage.educationDepartmentApproval.approverName', value)} />
        <TextField label="Дата погодження" value={getByPath(data, 'approvalPage.educationDepartmentApproval.approvalDate')} onChange={(value) => setDataField('approvalPage.educationDepartmentApproval.approvalDate', value)} />
      </div>

      <Subheading title="Пролонгація" />
      <div className="form-grid">
        <TextField label="Дата" value={getByPath(data, 'approvalPage.prolongation.date')} onChange={(value) => setDataField('approvalPage.prolongation.date', value)} />
        <TextField label="Завідувач кафедри" value={getByPath(data, 'approvalPage.prolongation.departmentHeadName')} onChange={(value) => setDataField('approvalPage.prolongation.departmentHeadName', value)} />
        <TextField label="Навчальний відділ" value={getByPath(data, 'approvalPage.prolongation.educationDepartmentApproverName')} onChange={(value) => setDataField('approvalPage.prolongation.educationDepartmentApproverName', value)} />
      </div>
    </>
  );
}

function TeacherSection({ editor, teachers, setTopField, setDataField, openTeacherDrawer }) {
  const data = editor.data;
  const teacher = getByPath(data, 'teacherInfo.primaryTeacher', null);

  return (
    <>
      <div className="teacher-picker-row">
        <SelectField
          label="Викладач документа"
          value={editor.teacher_id || ''}
          onChange={(value) => setTopField('teacher_id', value ? Number(value) : null)}
          options={[
            { value: '', label: 'Не обрано' },
            ...teachers.map((teacherItem) => ({ value: teacherItem.id, label: teacherItem.full_name })),
          ]}
        />
        <button type="button" className="secondary-button teacher-picker-button" onClick={openTeacherDrawer}>
          <Plus size={16} />
          Новий викладач
        </button>
      </div>

      <div className="summary-strip">
        <UserRound size={18} />
        <div>
          <strong>{teacher?.full_name || editor.teacher_full_name || 'Викладача не обрано'}</strong>
          <span>{[teacher?.degree, teacher?.position, teacher?.email].filter(Boolean).join(' · ') || 'Після вибору і збереження викладач потрапить у PDF.'}</span>
        </div>
      </div>

      <div className="form-grid">
        <TextField label="Профайл дисципліни" value={getByPath(data, 'teacherInfo.disciplineProfileUrl')} onChange={(value) => setDataField('teacherInfo.disciplineProfileUrl', value)} />
        <TextField label="Розклад консультацій" value={getByPath(data, 'teacherInfo.consultationScheduleUrl')} onChange={(value) => setDataField('teacherInfo.consultationScheduleUrl', value)} />
      </div>
    </>
  );
}

function DescriptionSection({ editor, setDataField }) {
  const data = editor.data;
  const semesters = ensureArray(getByPath(data, 'disciplineDescription.semesters', []));

  return (
    <div className="form-grid">
      <TextField label="Галузь знань" value={getByPath(data, 'disciplineDescription.knowledgeField')} onChange={(value) => setDataField('disciplineDescription.knowledgeField', value)} />
      <TextField label="Статус дисципліни" value={getByPath(data, 'disciplineDescription.disciplineStatus')} onChange={(value) => setDataField('disciplineDescription.disciplineStatus', value)} />
      <TextField label="Курс підготовки" value={getByPath(data, 'disciplineDescription.courseYear')} onChange={(value) => setDataField('disciplineDescription.courseYear', value)} />
      <TextField label="Семестри" value={semesters.join(', ')} onChange={(value) => setDataField('disciplineDescription.semesters', splitCsv(value))} placeholder="1, 2" />
      <NumberField label="Кредити ЄКТС" value={getByPath(data, 'disciplineDescription.credits', '')} onChange={(value) => setDataField('disciplineDescription.credits', value)} />
      <NumberField label="Загальна кількість годин" value={getByPath(data, 'disciplineDescription.totalHours', '')} onChange={(value) => setDataField('disciplineDescription.totalHours', value)} />
      <NumberField label="Аудиторні години" value={getByPath(data, 'disciplineDescription.classroomHours', '')} onChange={(value) => setDataField('disciplineDescription.classroomHours', value)} />
      <TextField label="Мова навчання" value={getByPath(data, 'disciplineDescription.language')} onChange={(value) => setDataField('disciplineDescription.language', value)} />
      <TextField label="Підсумковий контроль" value={getByPath(data, 'disciplineDescription.finalControl')} onChange={(value) => setDataField('disciplineDescription.finalControl', value)} />

      <NumberField label="Лекції, денна" value={getByPath(data, 'disciplineDescription.lecturesHours.fullTime', '')} onChange={(value) => setDataField('disciplineDescription.lecturesHours.fullTime', value)} />
      <NumberField label="Лекції, заочна" value={getByPath(data, 'disciplineDescription.lecturesHours.partTime', '')} onChange={(value) => setDataField('disciplineDescription.lecturesHours.partTime', value)} />
      <NumberField label="Практичні, денна" value={getByPath(data, 'disciplineDescription.practicalHours.fullTime', '')} onChange={(value) => setDataField('disciplineDescription.practicalHours.fullTime', value)} />
      <NumberField label="Практичні, заочна" value={getByPath(data, 'disciplineDescription.practicalHours.partTime', '')} onChange={(value) => setDataField('disciplineDescription.practicalHours.partTime', value)} />
      <NumberField label="Лабораторні, денна" value={getByPath(data, 'disciplineDescription.labHours.fullTime', '')} onChange={(value) => setDataField('disciplineDescription.labHours.fullTime', value)} />
      <NumberField label="Лабораторні, заочна" value={getByPath(data, 'disciplineDescription.labHours.partTime', '')} onChange={(value) => setDataField('disciplineDescription.labHours.partTime', value)} />
      <NumberField label="Самостійна, денна" value={getByPath(data, 'disciplineDescription.selfStudyHours.fullTime', '')} onChange={(value) => setDataField('disciplineDescription.selfStudyHours.fullTime', value)} />
      <NumberField label="Самостійна, заочна" value={getByPath(data, 'disciplineDescription.selfStudyHours.partTime', '')} onChange={(value) => setDataField('disciplineDescription.selfStudyHours.partTime', value)} />
    </div>
  );
}

function PurposeSection({ editor, setDataField, updateObjectItemField, addArrayItem, removeArrayItem }) {
  const data = editor.data;
  const outcomes = ensureArray(getByPath(data, 'learningOutcomes', []));

  return (
    <>
      <TextareaField label="Предмет вивчення" value={getByPath(data, 'purposeAndTasks.subject')} onChange={(value) => setDataField('purposeAndTasks.subject', value)} rows={4} />
      <TextareaField label="Мета викладання" value={getByPath(data, 'purposeAndTasks.purpose')} onChange={(value) => setDataField('purposeAndTasks.purpose', value)} rows={4} />
      <TextareaField label="Завдання вивчення" value={getByPath(data, 'purposeAndTasks.tasks')} onChange={(value) => setDataField('purposeAndTasks.tasks', value)} rows={4} />
      <TextareaField label="Пререквізити" value={getByPath(data, 'prerequisites')} onChange={(value) => setDataField('prerequisites', value)} rows={3} />
      <TextareaField label="Постреквізити" value={getByPath(data, 'postrequisites')} onChange={(value) => setDataField('postrequisites', value)} rows={3} />

      <Subheading title="Результати навчання" />
      <ObjectList
        items={outcomes}
        addLabel="Додати результат"
        onAdd={() => addArrayItem('learningOutcomes', { code: '', text: '' })}
        onRemove={(index) => removeArrayItem('learningOutcomes', index)}
        renderItem={(item, index) => (
          <div className="form-grid compact">
            <TextField label="Код" value={item.code || ''} onChange={(value) => updateObjectItemField('learningOutcomes', index, 'code', value)} />
            <TextareaField label="Текст" value={item.text || ''} onChange={(value) => updateObjectItemField('learningOutcomes', index, 'text', value)} rows={2} />
          </div>
        )}
      />
    </>
  );
}

function CourseProgramSection({
  editor,
  updateModuleField,
  updateObjectItemField,
  addArrayItem,
  removeArrayItem,
  addModuleTopic,
  updateModuleTopic,
  removeModuleTopic,
}) {
  const modules = ensureArray(getByPath(editor.data, 'courseProgram', []));

  return (
    <ObjectList
      items={modules}
      addLabel="Додати модуль"
      onAdd={() => addArrayItem('courseProgram', { title: '', topics: [] })}
      onRemove={(index) => removeArrayItem('courseProgram', index)}
      renderItem={(module, moduleIndex) => (
        <div className="stack">
          <TextField
            label="Назва змістового модуля"
            value={module.title || ''}
            onChange={(value) => updateModuleField(moduleIndex, 'title', value)}
          />
          <NestedList
            title="Теми модуля"
            items={ensureArray(module.topics)}
            addLabel="Додати тему"
            onAdd={() => addModuleTopic(moduleIndex)}
            onRemove={(topicIndex) => removeModuleTopic(moduleIndex, topicIndex)}
            renderItem={(topic, topicIndex) => (
              <div className="form-grid compact">
                <TextField label="Тема" value={topic.title || ''} onChange={(value) => updateModuleTopic(moduleIndex, topicIndex, 'title', value)} />
                <TextareaField label="Опис" value={topic.description || ''} onChange={(value) => updateModuleTopic(moduleIndex, topicIndex, 'description', value)} rows={3} />
              </div>
            )}
          />
        </div>
      )}
    />
  );
}

function ThematicPlanSection({ editor, updateObjectItemField, addArrayItem, removeArrayItem }) {
  const items = ensureArray(getByPath(editor.data, 'thematicPlan', []));

  return (
    <ObjectList
      items={items}
      addLabel="Додати тему"
      onAdd={() => addArrayItem('thematicPlan', { number: items.length + 1, title: '', lectures: null, labs: null, selfStudy: null, resources: '' })}
      onRemove={(index) => removeArrayItem('thematicPlan', index)}
      renderItem={(item, index) => (
        <div className="form-grid compact">
          <NumberField label="№" value={item.number ?? ''} onChange={(value) => updateObjectItemField('thematicPlan', index, 'number', value)} />
          <TextField label="Назва теми" value={item.title || ''} onChange={(value) => updateObjectItemField('thematicPlan', index, 'title', value)} />
          <NumberField label="Лекції" value={item.lectures ?? ''} onChange={(value) => updateObjectItemField('thematicPlan', index, 'lectures', value)} />
          <NumberField label="Лабораторні" value={item.labs ?? ''} onChange={(value) => updateObjectItemField('thematicPlan', index, 'labs', value)} />
          <NumberField label="Самостійна" value={item.selfStudy ?? ''} onChange={(value) => updateObjectItemField('thematicPlan', index, 'selfStudy', value)} />
          <TextField label="Література / ресурси" value={item.resources || ''} onChange={(value) => updateObjectItemField('thematicPlan', index, 'resources', value)} />
        </div>
      )}
    />
  );
}

function LabsSection({ editor, updateObjectItemField, addArrayItem, removeArrayItem }) {
  const labs = ensureArray(getByPath(editor.data, 'labs', []));

  return (
    <ObjectList
      items={labs}
      addLabel="Додати лабораторну"
      onAdd={() => addArrayItem('labs', { title: '', hours: null })}
      onRemove={(index) => removeArrayItem('labs', index)}
      renderItem={(item, index) => (
        <div className="form-grid compact">
          <TextField label="Назва роботи" value={item.title || ''} onChange={(value) => updateObjectItemField('labs', index, 'title', value)} />
          <NumberField label="Кількість годин" value={item.hours ?? ''} onChange={(value) => updateObjectItemField('labs', index, 'hours', value)} />
        </div>
      )}
    />
  );
}

function SelfStudySection({ editor, updateObjectItemField, addArrayItem, removeArrayItem }) {
  const data = editor.data;

  return (
    <>
      <Subheading title="Тематика самостійної роботи" />
      <ObjectList
        items={ensureArray(getByPath(data, 'selfStudy.topics', []))}
        addLabel="Додати тему"
        onAdd={() => addArrayItem('selfStudy.topics', { title: '', description: '' })}
        onRemove={(index) => removeArrayItem('selfStudy.topics', index)}
        renderItem={(item, index) => (
          <div className="form-grid compact">
            <TextField label="Тема" value={item.title || ''} onChange={(value) => updateObjectItemField('selfStudy.topics', index, 'title', value)} />
            <TextareaField label="Опис" value={item.description || ''} onChange={(value) => updateObjectItemField('selfStudy.topics', index, 'description', value)} rows={3} />
          </div>
        )}
      />

      <Subheading title="Рекомендації" />
      <StringList
        items={ensureArray(getByPath(data, 'selfStudy.recommendations', []))}
        addLabel="Додати рекомендацію"
        onAdd={() => addArrayItem('selfStudy.recommendations', '')}
        onChange={(index, value) => updateObjectItemField('selfStudy.recommendations', index, null, value)}
        onRemove={(index) => removeArrayItem('selfStudy.recommendations', index)}
      />

      <Subheading title="Методичне забезпечення" />
      <StringList
        items={ensureArray(getByPath(data, 'selfStudy.methodicalSupport', []))}
        addLabel="Додати пункт"
        onAdd={() => addArrayItem('selfStudy.methodicalSupport', '')}
        onChange={(index, value) => updateObjectItemField('selfStudy.methodicalSupport', index, null, value)}
        onRemove={(index) => removeArrayItem('selfStudy.methodicalSupport', index)}
      />
    </>
  );
}

function AssessmentSection({ editor, updateObjectItemField, addArrayItem, removeArrayItem }) {
  const data = editor.data;

  return (
    <>
      <Subheading title="Методи контролю" />
      <StringList
        items={ensureArray(getByPath(data, 'assessment.controlMethods', []))}
        addLabel="Додати метод"
        onAdd={() => addArrayItem('assessment.controlMethods', '')}
        onChange={(index, value) => updateObjectItemField('assessment.controlMethods', index, null, value)}
        onRemove={(index) => removeArrayItem('assessment.controlMethods', index)}
      />

      <Subheading title="Критерії оцінювання" />
      <ObjectList
        items={ensureArray(getByPath(data, 'assessment.criteria', []))}
        addLabel="Додати критерій"
        onAdd={() => addArrayItem('assessment.criteria', { title: '', description: '' })}
        onRemove={(index) => removeArrayItem('assessment.criteria', index)}
        renderItem={(item, index) => (
          <div className="form-grid compact">
            <TextField label="Критерій" value={item.title || ''} onChange={(value) => updateObjectItemField('assessment.criteria', index, 'title', value)} />
            <TextareaField label="Опис" value={item.description || ''} onChange={(value) => updateObjectItemField('assessment.criteria', index, 'description', value)} rows={3} />
          </div>
        )}
      />

      <Subheading title="Шкала оцінювання" />
      <ObjectList
        items={ensureArray(getByPath(data, 'assessment.scale', []))}
        addLabel="Додати рівень"
        onAdd={() => addArrayItem('assessment.scale', { grade: '', points: '' })}
        onRemove={(index) => removeArrayItem('assessment.scale', index)}
        renderItem={(item, index) => (
          <div className="form-grid compact">
            <TextField label="Оцінка" value={item.grade || ''} onChange={(value) => updateObjectItemField('assessment.scale', index, 'grade', value)} />
            <TextField label="Бали" value={item.points || ''} onChange={(value) => updateObjectItemField('assessment.scale', index, 'points', value)} />
          </div>
        )}
      />
    </>
  );
}

function ExamSection({ editor, setDataField, updateObjectItemField, addArrayItem, removeArrayItem }) {
  const data = editor.data;

  return (
    <>
      <TextField
        label="Назва розділу"
        value={getByPath(data, 'examQuestions.title')}
        onChange={(value) => setDataField('examQuestions.title', value)}
        placeholder="Питання до іспиту"
      />
      <StringList
        items={ensureArray(getByPath(data, 'examQuestions.items', []))}
        addLabel="Додати питання"
        onAdd={() => addArrayItem('examQuestions.items', '')}
        onChange={(index, value) => updateObjectItemField('examQuestions.items', index, null, value)}
        onRemove={(index) => removeArrayItem('examQuestions.items', index)}
      />
    </>
  );
}

function ReferencesSection({ editor, setDataField, updateObjectItemField, addArrayItem, removeArrayItem }) {
  const data = editor.data;

  return (
    <>
      <Subheading title="Рекомендована література" />
      <ObjectList
        items={ensureArray(getByPath(data, 'literature', []))}
        addLabel="Додати джерело"
        onAdd={() => addArrayItem('literature', { text: '' })}
        onRemove={(index) => removeArrayItem('literature', index)}
        renderItem={(item, index) => (
          <TextareaField label="Джерело" value={item.text || ''} onChange={(value) => updateObjectItemField('literature', index, 'text', value)} rows={2} />
        )}
      />

      <Subheading title="Інформаційні ресурси" />
      <ObjectList
        items={ensureArray(getByPath(data, 'informationResources', []))}
        addLabel="Додати ресурс"
        onAdd={() => addArrayItem('informationResources', { text: '' })}
        onRemove={(index) => removeArrayItem('informationResources', index)}
        renderItem={(item, index) => (
          <TextareaField label="Ресурс" value={item.text || ''} onChange={(value) => updateObjectItemField('informationResources', index, 'text', value)} rows={2} />
        )}
      />

      <Subheading title="Методи навчання" />
      <StringList
        items={ensureArray(getByPath(data, 'teachingMethods', []))}
        addLabel="Додати метод"
        onAdd={() => addArrayItem('teachingMethods', '')}
        onChange={(index, value) => updateObjectItemField('teachingMethods', index, null, value)}
        onRemove={(index) => removeArrayItem('teachingMethods', index)}
      />

      <Subheading title="Політика дисципліни" />
      <TextareaField
        label="Текст політики"
        value={getByPath(data, 'disciplinePolicy')}
        onChange={(value) => setDataField('disciplinePolicy', value)}
        rows={5}
      />
    </>
  );
}

function ObjectList({ items, addLabel, onAdd, onRemove, renderItem }) {
  return (
    <div className="array-list">
      {items.length === 0 && <div className="empty-state inline">Поки немає рядків</div>}
      {items.map((item, index) => (
        <div className="array-row" key={index}>
          <div className="array-row-index">{index + 1}</div>
          <div className="array-row-body">{renderItem(item, index)}</div>
          <button type="button" className="danger-icon-button small" onClick={() => onRemove(index)} title="Видалити рядок">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="secondary-button add-row-button" onClick={onAdd}>
        <Plus size={16} />
        {addLabel}
      </button>
    </div>
  );
}

function NestedList({ title, items, addLabel, onAdd, onRemove, renderItem }) {
  return (
    <div className="nested-list">
      <div className="nested-list-title">{title}</div>
      {items.length === 0 && <div className="empty-state inline">Тем поки немає</div>}
      {items.map((item, index) => (
        <div className="nested-row" key={index}>
          <div className="array-row-body">{renderItem(item, index)}</div>
          <button type="button" className="danger-icon-button small" onClick={() => onRemove(index)} title="Видалити тему">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="secondary-button add-row-button" onClick={onAdd}>
        <Plus size={16} />
        {addLabel}
      </button>
    </div>
  );
}

function StringList({ items, addLabel, onAdd, onChange, onRemove }) {
  return (
    <div className="array-list">
      {items.length === 0 && <div className="empty-state inline">Поки немає пунктів</div>}
      {items.map((item, index) => (
        <div className="array-row simple" key={index}>
          <div className="array-row-index">{index + 1}</div>
          <TextareaField
            label={`Пункт ${index + 1}`}
            value={typeof item === 'string' ? item : item?.text || ''}
            onChange={(value) => onChange(index, value)}
            rows={2}
          />
          <button type="button" className="danger-icon-button small" onClick={() => onRemove(index)} title="Видалити пункт">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" className="secondary-button add-row-button" onClick={onAdd}>
        <Plus size={16} />
        {addLabel}
      </button>
    </div>
  );
}

function Subheading({ title }) {
  return <h3 className="subheading">{title}</h3>;
}

function TextField({ label, value, onChange, placeholder = '', required = false, autoComplete }) {
  const error = getFieldValidation({ label, value, required });
  const hint = getFieldHint({ label, required });

  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span>{label}{required && <b className="required-mark"> *</b>}</span>
      <input
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
      />
      <small className="field-help">{error || hint}</small>
    </label>
  );
}

function PasswordField({ label, value, onChange, required = false, autoComplete = 'current-password' }) {
  const error = required && String(value || '').length < 8
    ? 'Пароль має містити мінімум 8 символів.'
    : '';

  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span>{label}{required && <b className="required-mark"> *</b>}</span>
      <input
        type="password"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
      />
      <small className="field-help">{error || 'Тип даних: пароль, мінімум 8 символів.'}</small>
    </label>
  );
}

function NumberField({ label, value, onChange, required = false }) {
  const error = getFieldValidation({ label, value, required, kind: 'number' });
  const hint = getFieldHint({ label, required, kind: 'number' });

  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span>{label}{required && <b className="required-mark"> *</b>}</span>
      <input
        type="number"
        value={value ?? ''}
        onChange={(event) => onChange(toNumberOrNull(event.target.value))}
        aria-invalid={Boolean(error)}
      />
      <small className="field-help">{error || hint}</small>
    </label>
  );
}

function TextareaField({ label, value, onChange, rows = 3, required = false }) {
  const error = getFieldValidation({ label, value, required });
  const hint = getFieldHint({ label, required });

  return (
    <label className={`field full ${error ? 'has-error' : ''}`}>
      <span>{label}{required && <b className="required-mark"> *</b>}</span>
      <textarea
        rows={rows}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      />
      <small className="field-help">{error || hint}</small>
    </label>
  );
}

function SelectField({ label, value, onChange, options, required = false }) {
  const error = getFieldValidation({ label, value, required });
  const hint = getFieldHint({ label, required });

  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span>{label}{required && <b className="required-mark"> *</b>}</span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <small className="field-help">{error || hint}</small>
    </label>
  );
}

export default App;
