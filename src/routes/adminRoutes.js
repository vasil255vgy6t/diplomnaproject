const express = require("express");
const { ADMIN_EMAIL, ADMIN_PASSWORD } = require("../config/env");
const { createSession, hasSession, deleteSession } = require("../services/adminSessionService");
const { query } = require("../db/sqlite");

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

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Неправильний логін або пароль адміністратора" });
    }

    const token = createSession(email);
    res.json({ message: "Успішний вхід адміністратора", token, email });
});

router.post("/api/admin/logout", requireAdminAuth, (req, res) => {
    deleteSession(req.adminToken);
    res.json({ message: "Вихід виконано" });
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

        res.json({
            message: "Агреговану статистику отримано успішно",
            overall,
            testsStats,
        });
    } catch (error) {
        console.error("Помилка при отриманні статистики:", error);
        res.status(500).json({ message: "Помилка при отриманні агрегованої статистики" });
    }
});

module.exports = router;
