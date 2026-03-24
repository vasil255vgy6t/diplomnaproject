const express = require("express");
const { getTests, addTestResult, findTestById, addAnonymousAnswers } = require("../data/mockStore");

const router = express.Router();

router.get("/", (req, res) => {
    res.send("Backend для Mental Health працює (SQLite)");
});

router.get("/api/test-db", (req, res) => {
    res.json({
        message: "Працює у демо-режимі без БД",
        time: new Date().toISOString(),
    });
});

router.get("/api/tests", (req, res) => {
    try {
        res.json({
            message: "Список тестів отримано успішно",
            tests: getTests(),
        });
    } catch (error) {
        console.error("Помилка при отриманні тестів:", error);
        res.status(500).json({ message: "Помилка при отриманні тестів" });
    }
});

router.post("/api/test-results", (req, res) => {
    try {
        const { test_id, score, level, answers = [], anonymous_session_id } = req.body;

        if (!test_id || score === undefined || !level) {
            return res.status(400).json({ message: "Не всі поля заповнені" });
        }

        const inserted = addTestResult({ test_id, score, level });
        const test = findTestById(test_id);
        if (test && Array.isArray(answers) && answers.length > 0 && anonymous_session_id) {
            addAnonymousAnswers({
                anonymous_session_id,
                test_code: test.code,
                answers,
            });
        }

        res.status(201).json({
            message: "Результат тесту успішно збережено",
            test_result: inserted,
        });
    } catch (error) {
        console.error("Помилка при збереженні результату:", error);
        res.status(500).json({ message: "Помилка при збереженні результату тесту" });
    }
});

module.exports = router;
