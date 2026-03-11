const express = require("express");
const { query, run } = require("../db/sqlite");

const router = express.Router();

router.get("/", (req, res) => {
    res.send("Backend для Mental Health працює (SQLite)");
});

router.get("/api/test-db", (req, res) => {
    try {
        const result = query("SELECT datetime('now') AS now;");
        res.json({
            message: "Підключення до SQLite успішне",
            time: result[0]?.now,
        });
    } catch (error) {
        console.error("Помилка підключення до БД:", error);
        res.status(500).json({ message: "Помилка підключення до SQLite" });
    }
});

router.get("/api/tests", (req, res) => {
    try {
        const tests = query("SELECT * FROM tests ORDER BY id ASC;");
        res.json({
            message: "Список тестів отримано успішно",
            tests,
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

        run(
            "INSERT INTO test_results (test_id, score, level) VALUES (?, ?, ?);",
            [Number(test_id), Number(score), level]
        );

        const inserted = query("SELECT * FROM test_results ORDER BY id DESC LIMIT 1;")[0];

        const test = query("SELECT code FROM tests WHERE id = ? LIMIT 1;", [Number(test_id)])[0];
        if (test && Array.isArray(answers) && answers.length > 0 && anonymous_session_id) {
            const questions = query(
                "SELECT id, question_order FROM test_questions WHERE test_code = ? ORDER BY question_order ASC;",
                [test.code]
            );

            answers.forEach((answerValue, idx) => {
                const question = questions[idx];
                if (!question) {
                    return;
                }

                run(
                    `INSERT INTO anonymous_answers (anonymous_session_id, test_code, question_id, answer_value)
                     VALUES (?, ?, ?, ?);`,
                    [anonymous_session_id, test.code, question.id, Number(answerValue)]
                );
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
