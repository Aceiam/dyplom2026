// Базова структура data JSONB для нової робочої програми.
// Frontend може брати її як "порожній документ" і поступово заповнювати поля.
const buildWorkingProgramDefaultData = (program = {}, teacher = null) => ({
  meta: {
    documentType: 'working_program',
    version: 1,
  },
  titlePage: {
    // Дані першої титульної сторінки.
    university: '',
    faculty: '',
    department: '',
    approval: {
      approverPosition: '',
      approverName: '',
      protocolNumber: '',
      protocolDate: '',
    },
    disciplineName: program.discipline_name || '',
    programCode: '',
    educationDegree: program.education_level || '',
    specialtyCode: program.specialty_code || '',
    specialtyName: program.specialty_name || '',
    educationalProgram: program.educational_program || '',
    academicYear: program.academic_year || '',
  },
  approvalPage: {
    // Дані другої сторінки з погодженнями, протоколами та підписами.
    documentDescription: '',
    developers: teacher ? [teacher] : [],
    departmentApproval: {
      departmentName: '',
      protocolNumber: '',
      protocolDate: '',
      headName: '',
    },
    facultyMethodicalCommission: {
      protocolNumber: '',
      protocolDate: '',
      headName: '',
    },
    educationDepartmentApproval: {
      approverName: '',
      approvalDate: '',
    },
    prolongation: {
      date: '',
      departmentHeadName: '',
      educationDepartmentApproverName: '',
    },
  },
  teacherInfo: {
    primaryTeacher: teacher,
    consultationScheduleUrl: '',
    disciplineProfileUrl: '',
  },
  disciplineDescription: {
    // Таблиця опису дисципліни: кредити, години, семестри, контроль.
    knowledgeField: '',
    specialty: {
      code: program.specialty_code || '',
      name: program.specialty_name || '',
    },
    educationalProgram: program.educational_program || '',
    educationLevel: program.education_level || '',
    disciplineStatus: '',
    courseYear: '',
    semesters: [],
    credits: null,
    totalHours: null,
    classroomHours: null,
    lecturesHours: {
      fullTime: null,
      partTime: null,
    },
    practicalHours: {
      fullTime: null,
      partTime: null,
    },
    labHours: {
      fullTime: null,
      partTime: null,
    },
    selfStudyHours: {
      fullTime: null,
      partTime: null,
    },
    language: '',
    finalControl: '',
  },
  purposeAndTasks: {
    // Розділ "Предмет, мета і завдання навчальної дисципліни".
    subject: '',
    purpose: '',
    tasks: '',
  },
  learningOutcomes: [],
  // Далі йдуть масиви/секції, які у PDF перетворюються на списки й таблиці.
  prerequisites: '',
  postrequisites: '',
  courseProgram: [],
  thematicPlan: [],
  labs: [],
  selfStudy: {
    recommendations: [],
    topics: [],
    methodicalSupport: [],
  },
  assessment: {
    controlMethods: [],
    scale: [],
    criteria: [],
  },
  examQuestions: {
    title: '',
    items: [],
  },
  literature: [],
  informationResources: [],
  teachingMethods: [],
  disciplinePolicy: '',
});

module.exports = buildWorkingProgramDefaultData;
