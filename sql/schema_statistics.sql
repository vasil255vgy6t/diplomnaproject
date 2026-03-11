-- SQLite schema for analytics-oriented anonymous testing
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_code TEXT NOT NULL,            -- e.g. stress_test / sleep_test
    question_order INTEGER NOT NULL,    -- position in test
    question_text TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (test_code, question_order)
);

CREATE TABLE IF NOT EXISTS anonymous_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anonymous_session_id TEXT NOT NULL, -- random UUID from frontend per test pass
    test_code TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    answer_value INTEGER NOT NULL,      -- normalized numeric scale (e.g. 0..4)
    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_questions_test_code
    ON test_questions(test_code, question_order);

CREATE INDEX IF NOT EXISTS idx_answers_test_code
    ON anonymous_answers(test_code);

CREATE INDEX IF NOT EXISTS idx_answers_question_id
    ON anonymous_answers(question_id);

CREATE INDEX IF NOT EXISTS idx_answers_session
    ON anonymous_answers(anonymous_session_id);

-- Example statistics query:
-- average answer by question in each test
-- SELECT
--   a.test_code,
--   a.question_id,
--   ROUND(AVG(a.answer_value), 2) AS avg_answer,
--   COUNT(*) AS answers_count
-- FROM anonymous_answers a
-- GROUP BY a.test_code, a.question_id
-- ORDER BY a.test_code, a.question_id;
