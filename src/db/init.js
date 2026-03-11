const fs = require("fs");
const path = require("path");
const { resolvedDbPath, run } = require("./sqlite");

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
        INSERT OR IGNORE INTO tests (id, code, title, description)
        VALUES
            (1, 'stress_test', 'Шкала стресу', 'Оцінка рівня стресу'),
            (2, 'burnout_test', 'Академічне вигорання', 'Оцінка ознак вигорання'),
            (3, 'sleep_test', 'Якість сну', 'Оцінка якості сну'),
            (4, 'anxiety_test', 'Тривожність', 'Оцінка рівня тривожності');
    `);
}

module.exports = { initializeDatabase };
