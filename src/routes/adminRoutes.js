const express = require("express");
const { createSession, hasSession, deleteSession } = require("../services/adminSessionService");
const { verifyPassword } = require("../services/securityService");
const { hashPassword } = require("../services/securityService");
const { findAdminByEmail, addAdmin, getAdminPublicFields, getStats } = require("../data/mockStore");

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

    const admin = findAdminByEmail(email);

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

        const existing = findAdminByEmail(email);
        if (existing) {
            return res.status(409).json({ message: "Адміністратор з такою поштою вже існує" });
        }

        const { salt, hash } = hashPassword(password);
        addAdmin({ email, password_hash: hash, salt, institution });
        const created = getAdminPublicFields(email);

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
        const { overall, testsStats, questionStats } = getStats();

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
