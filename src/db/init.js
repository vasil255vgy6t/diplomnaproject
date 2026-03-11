const fs = require("fs");
const path = require("path");
const { resolvedDbPath, run, query } = require("./sqlite");
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require("../config/env");
const { hashPassword } = require("../services/securityService");

const QUESTION_BANK = {
    stress_test: [
        "Як часто ти відчуваєш напругу або стрес під час навчання?",
        "Як часто тобі складно зосередитися через хвилювання?",
        "Як часто ти відчуваєш втому ще до початку дня?",
        "Як часто дедлайни викликають сильну тривогу?",
        "Як часто ти відчуваєш, що не встигаєш усе зробити?",
    ],
    burnout_test: [
        "Як часто ти відчуваєш емоційне виснаження після навчання?",
        "Як часто тобі складно знайти мотивацію до навчання?",
        "Як часто ти відчуваєш байдужість до результатів?",
        "Як часто тобі здається, що навчання не має сенсу?",
        "Як часто ти відчуваєш, що потребуєш довгої паузи від навчання?",
    ],
    sleep_test: [
        "Як часто ти лягаєш спати пізніше, ніж планував(ла)?",
        "Як часто ти прокидаєшся вночі та довго не можеш заснути?",
        "Як часто вранці ти відчуваєш втому після сну?",
        "Як часто тобі важко прокидатися вранці?",
        "Як часто ти відчуваєш сонливість протягом дня?",
    ],
    anxiety_test: [
        "Як часто ти відчуваєш безпричинне хвилювання?",
        "Як часто ти відчуваєш напруження у тілі через тривогу?",
        "Як часто ти не можеш розслабитися навіть у спокійній обстановці?",
        "Як часто твої думки швидко змінюються і складно зосередитися?",
        "Як часто тривога заважає тобі у навчанні чи спілкуванні?",
    ],
};

function initializeDatabase() {
    fs.mkdirSync(path.dirname(resolvedDbPath), { recursive: true });

    run(`
        CREATE TABLE IF NOT EXISTS tests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT
        );
    `);

    run(`
        CREATE TABLE IF NOT EXISTS test_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            level TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (test_id) REFERENCES tests(id)
        );
    `);

    run(`
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `);

    run(`
        CREATE TABLE IF NOT EXISTS test_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            test_code TEXT NOT NULL,
            question_order INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (test_code, question_order)
        );
    `);

    run(`
        CREATE TABLE IF NOT EXISTS anonymous_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            anonymous_session_id TEXT NOT NULL,
            test_code TEXT NOT NULL,
            question_id INTEGER NOT NULL,
            answer_value INTEGER NOT NULL,
            submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE RESTRICT
        );
    `);

    run(`
        CREATE INDEX IF NOT EXISTS idx_questions_test_code
        ON test_questions(test_code, question_order);
    `);

    run(`
        CREATE INDEX IF NOT EXISTS idx_answers_test_code
        ON anonymous_answers(test_code);
    `);

    run(`
        CREATE INDEX IF NOT EXISTS idx_answers_question_id
        ON anonymous_answers(question_id);
    `);

    run(`
        CREATE INDEX IF NOT EXISTS idx_answers_session
        ON anonymous_answers(anonymous_session_id);
    `);

    run(`
        INSERT OR IGNORE INTO tests (id, code, title, description)
        VALUES
            (1, 'stress_test', 'Шкала стресу', 'Оцінка рівня стресу'),
            (2, 'burnout_test', 'Академічне вигорання', 'Оцінка ознак вигорання'),
            (3, 'sleep_test', 'Якість сну', 'Оцінка якості сну'),
            (4, 'anxiety_test', 'Тривожність', 'Оцінка рівня тривожності');
    `);

    for (const [testCode, questions] of Object.entries(QUESTION_BANK)) {
        questions.forEach((questionText, index) => {
            run(
                `INSERT OR IGNORE INTO test_questions (test_code, question_order, question_text) VALUES (?, ?, ?);`,
                [testCode, index + 1, questionText]
            );
        });
    }

    const adminExists = query("SELECT id FROM admins WHERE email = ? LIMIT 1;", [ADMIN_EMAIL])[0];
    if (!adminExists) {
        const { salt, hash } = hashPassword(ADMIN_PASSWORD);
        run(
            "INSERT INTO admins (email, password_hash, salt, is_active) VALUES (?, ?, ?, 1);",
            [ADMIN_EMAIL, hash, salt]
        );
    }
}

module.exports = { initializeDatabase };
