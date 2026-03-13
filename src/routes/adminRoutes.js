const express = require("express");
const { createSession, hasSession, deleteSession } = require("../services/adminSessionService");
const { query, run } = require("../db/sqlite");
const { verifyPassword } = require("../services/securityService");
const { hashPassword } = require("../services/securityService");

const router = express.Router();

function requireAdminAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token || !hasSession(token)) {
        return res.status(401).json({ message: "Потрібна авторизація адміністратора" });
    }

    req.adminToken = token;
    next();
}

router.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Не всі поля заповнені" });
    }

    const admin = query(
        "SELECT id, email, password_hash, salt, is_active FROM admins WHERE email = ? LIMIT 1;",
        [email]
    )[0];

    if (!admin || Number(admin.is_active) !== 1) {
        return res.status(401).json({ message: "Неправильний логін або пароль адміністратора" });
    }

    if (!verifyPassword(password, admin.salt, admin.password_hash)) {
        return res.status(401).json({ message: "Неправильний логін або пароль адміністратора" });
    }

    const token = createSession(admin.email);
    res.json({ message: "Успішний вхід адміністратора", token, email: admin.email });
});

router.post("/api/admin/logout", requireAdminAuth, (req, res) => {
    deleteSession(req.adminToken);
    res.json({ message: "Вихід виконано" });
});

router.post("/api/admin/register", requireAdminAuth, (req, res) => {
    try {
        const { email, password, institution } = req.body;

        if (!email || !password || !institution) {
            return res.status(400).json({ message: "Не всі поля заповнені" });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ message: "Пароль повинен містити щонайменше 6 символів" });
        }

        const existing = query("SELECT id FROM admins WHERE email = ? LIMIT 1;", [email])[0];
        if (existing) {
            return res.status(409).json({ message: "Адміністратор з такою поштою вже існує" });
        }

        const { salt, hash } = hashPassword(password);
        run(
            `INSERT INTO admins (email, password_hash, salt, institution, is_active)
             VALUES (?, ?, ?, ?, 1);`,
            [email, hash, salt, institution]
        );

        const created = query(
            "SELECT id, email, institution, is_active, created_at FROM admins WHERE email = ? LIMIT 1;",
            [email]
        )[0];

        res.status(201).json({
            message: "Нового адміністратора успішно зареєстровано",
            admin: created,
        });
    } catch (error) {
        console.error("Помилка реєстрації адміністратора:", error);
        res.status(500).json({ message: "Помилка реєстрації адміністратора" });
    }
});

router.get("/api/admin/stats", requireAdminAuth, (req, res) => {
    try {
        const overall = query(`
            SELECT
                COUNT(*) AS total_submissions,
                COALESCE(ROUND(AVG(score), 1), 0) AS overall_avg_score
            FROM test_results;
        `)[0];

        const testsStats = query(`
            SELECT
                t.id,
                t.code,
                t.title,
                COUNT(tr.id) AS submissions,
                COALESCE(ROUND(AVG(tr.score), 1), 0) AS avg_score,
                COALESCE(MIN(tr.score), 0) AS min_score,
                COALESCE(MAX(tr.score), 0) AS max_score
            FROM tests t
            LEFT JOIN test_results tr ON tr.test_id = t.id
            GROUP BY t.id, t.code, t.title
            ORDER BY t.id ASC;
        `);

        const questionStats = query(`
            SELECT
                tq.test_code,
                tq.question_order,
                tq.question_text,
                COUNT(aa.id) AS answers_count,
                COALESCE(ROUND(AVG(aa.answer_value), 2), 0) AS avg_answer_value
            FROM test_questions tq
            LEFT JOIN anonymous_answers aa ON aa.question_id = tq.id
            GROUP BY tq.id, tq.test_code, tq.question_order, tq.question_text
            ORDER BY tq.test_code, tq.question_order;
        `);

        res.json({
            message: "Агреговану статистику отримано успішно",
            overall,
            testsStats,
            questionStats,
        });
    } catch (error) {
        console.error("Помилка при отриманні статистики:", error);
        res.status(500).json({ message: "Помилка при отриманні агрегованої статистики" });
    }
});

module.exports = router;
