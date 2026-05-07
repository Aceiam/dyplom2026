-- Довідник викладачів. Дані звідси можуть копіюватися у snapshot робочої програми.
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    degree TEXT,
    academic_title TEXT,
    position TEXT,
    department TEXT,
    university TEXT,
    phone TEXT,
    email TEXT,
    profile_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Старий універсальний модуль документів. Лишений для сумісності з попереднім етапом.
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Основна таблиця дипломної: робочі програми навчальних дисциплін.
CREATE TABLE IF NOT EXISTS working_programs (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,

    title TEXT NOT NULL,
    discipline_name TEXT NOT NULL,
    academic_year TEXT NOT NULL,

    specialty_code TEXT,
    specialty_name TEXT,
    educational_program TEXT,
    education_level TEXT,

    -- У data JSONB зберігається велика вкладена структура документа.
    data JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Індекси для майбутнього пошуку/фільтрації у списку робочих програм.
CREATE INDEX IF NOT EXISTS idx_working_programs_academic_year
    ON working_programs (academic_year);

CREATE INDEX IF NOT EXISTS idx_working_programs_discipline_name
    ON working_programs (discipline_name);

CREATE INDEX IF NOT EXISTS idx_working_programs_specialty_code
    ON working_programs (specialty_code);
