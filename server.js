const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

function hashPassword(password, salt = null) {
    const actualSalt = salt || crypto.randomBytes(16).toString("hex");
    const hash = crypto
        .pbkdf2Sync(password, actualSalt, 100000, 64, "sha512")
        .toString("hex");
    return { salt: actualSalt, hash };
}

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
        const { user_id, test_id, score, level } = req.body;

        if (!user_id || !test_id || score === undefined || !level) {
            return res.status(400).json({
                message: "Не всі поля заповнені",
            });
        }

        const result = await pool.query(
            `
            INSERT INTO test_results (user_id, test_id, score, level)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
            `,
            [user_id, test_id, score, level]
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

app.get("/api/dashboard/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        const result = await pool.query(
            `
            SELECT 
                tr.id,
                tr.user_id,
                tr.test_id,
                tr.score,
                tr.level,
                tr.created_at,
                t.code,
                t.title
            FROM test_results tr
            JOIN tests t ON tr.test_id = t.id
            WHERE tr.user_id = $1
            ORDER BY tr.created_at DESC;
            `,
            [userId]
        );

        res.json({
            message: "Дані dashboard отримано успішно",
            results: result.rows,
        });
    } catch (error) {
        console.error("Помилка при отриманні dashboard:", error);
        res.status(500).json({
            message: "Помилка при отриманні даних dashboard",
        });
    }
});

app.post("/api/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Не всі поля заповнені" });
        }

        const { salt, hash } = hashPassword(password);

        const result = await pool.query(
            `
            INSERT INTO users (email, password_hash, salt)
            VALUES ($1, $2, $3)
            RETURNING id, email;
            `,
            [email, hash, salt]
        );

        res.status(201).json({
            message: "Реєстрація успішна",
            user_id: result.rows[0].id,
            email: result.rows[0].email,
        });
    } catch (error) {
        console.error("Помилка при реєстрації:", error);
        if (error.code === "23505") {
            return res.status(409).json({ message: "Користувач з таким email вже існує" });
        }
        res.status(500).json({ message: "Помилка при реєстрації" });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Не всі поля заповнені" });
        }

        const result = await pool.query(
            `SELECT id, email, password_hash, salt FROM users WHERE email = $1 LIMIT 1;`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Неправильна електронна пошта або пароль" });
        }

        const user = result.rows[0];
        const { hash } = hashPassword(password, user.salt);

        if (hash !== user.password_hash) {
            return res.status(401).json({ message: "Неправильна електронна пошта або пароль" });
        }

        res.json({
            message: "Успішний вхід",
            user_id: user.id,
            email: user.email,
        });
    } catch (error) {
        console.error("Помилка при вході:", error);
        res.status(500).json({ message: "Помилка при вході" });
    }
});

async function initializeDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

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
            user_id INTEGER NOT NULL,
            test_id INTEGER NOT NULL,
            score INTEGER NOT NULL,
            level TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

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