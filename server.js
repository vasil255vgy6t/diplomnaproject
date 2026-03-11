const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const adminSessions = new Map();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@college.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

function createAdminToken() {
    return crypto.randomBytes(24).toString("hex");
}

function requireAdminAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token || !adminSessions.has(token)) {
        return res.status(401).json({ message: "Потрібна авторизація адміністратора" });
    }

    req.admin = adminSessions.get(token);
    next();
}

app.get("/", (req, res) => {
    res.send("Backend для Mental Health працює");
});

app.get("/api/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            message: "Підключення до PostgreSQL успішне",
            time: result.rows[0].now,
        });
    } catch (error) {
        console.error("Помилка підключення до БД:", error);
        res.status(500).json({
            message: "Помилка підключення до PostgreSQL",
        });
    }
});

app.get("/api/tests", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM tests ORDER BY id ASC");
        res.json({
            message: "Список тестів отримано успішно",
            tests: result.rows,
        });
    } catch (error) {
        console.error("Помилка при отриманні тестів:", error);
        res.status(500).json({
            message: "Помилка при отриманні тестів",
        });
    }
});

app.post("/api/test-results", async (req, res) => {
    try {
        const { test_id, score, level } = req.body;

        if (!test_id || score === undefined || !level) {
            return res.status(400).json({
                message: "Не всі поля заповнені",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO test_results (test_id, score, level)
            VALUES ($1, $2, $3)
            RETURNING *;
            `,
            [test_id, score, level]
        );

        res.status(201).json({
            message: "Результат тесту успішно збережено",
            test_result: result.rows[0],
        });
    } catch (error) {
        console.error("Помилка при збереженні результату:", error);
        res.status(500).json({
            message: "Помилка при збереженні результату тесту",
        });
    }
});

app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Не всі поля заповнені" });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Неправильний логін або пароль адміністратора" });
    }

    const token = createAdminToken();
    adminSessions.set(token, { email, createdAt: Date.now() });

    res.json({
        message: "Успішний вхід адміністратора",
        token,
        email,
    });
});

app.post("/api/admin/logout", requireAdminAuth, (req, res) => {
    const token = req.headers.authorization.slice(7);
    adminSessions.delete(token);
    res.json({ message: "Вихід виконано" });
});

app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
        const overall = await pool.query(`
            SELECT
                COUNT(*)::int AS total_submissions,
                COALESCE(ROUND(AVG(score)::numeric, 1), 0) AS overall_avg_score
            FROM test_results;
        `);

        const testsStats = await pool.query(`
            SELECT
                t.id,
                t.code,
                t.title,
                COUNT(tr.id)::int AS submissions,
                COALESCE(ROUND(AVG(tr.score)::numeric, 1), 0) AS avg_score,
                COALESCE(MIN(tr.score), 0) AS min_score,
                COALESCE(MAX(tr.score), 0) AS max_score
            FROM tests t
            LEFT JOIN test_results tr ON tr.test_id = t.id
            GROUP BY t.id, t.code, t.title
            ORDER BY t.id ASC;
        `);

        const levels = await pool.query(`
            SELECT
                t.code,
                tr.level,
                COUNT(*)::int AS count
            FROM test_results tr
            JOIN tests t ON t.id = tr.test_id
            GROUP BY t.code, tr.level
            ORDER BY t.code, tr.level;
        `);

        res.json({
            message: "Агреговану статистику отримано успішно",
            overall: overall.rows[0],
            testsStats: testsStats.rows,
            levels: levels.rows,
        });
    } catch (error) {
        console.error("Помилка при отриманні статистики:", error);
        res.status(500).json({
            message: "Помилка при отриманні агрегованої статистики",
        });
    }
});

async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tests (
            id SERIAL PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS test_results (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            test_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            level TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    await pool.query(`
        ALTER TABLE test_results
        ALTER COLUMN user_id DROP NOT NULL;
    `).catch(() => undefined);

    await pool.query(`
        INSERT INTO tests (code, title, description)
        VALUES
            ('stress_test', 'Шкала стресу', 'Оцінка рівня стресу'),
            ('burnout_test', 'Академічне вигорання', 'Оцінка ознак вигорання'),
            ('sleep_test', 'Якість сну', 'Оцінка якості сну'),
            ('anxiety_test', 'Тривожність', 'Оцінка рівня тривожності')
        ON CONFLICT (code) DO NOTHING;
    `);
}

initializeDatabase().catch((error) => {
    console.error("Не вдалося ініціалізувати базу даних:", error);
    process.exit(1);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Сервер запущено: http://localhost:${PORT}`);
});
