const { ADMIN_EMAIL, ADMIN_PASSWORD } = require("../config/env");
const { hashPassword } = require("../services/securityService");

const tests = [
    { id: 1, code: "stress_test", title: "Шкала стресу", description: "Оцінка рівня стресу" },
    { id: 2, code: "burnout_test", title: "Академічне вигорання", description: "Оцінка ознак вигорання" },
    { id: 3, code: "sleep_test", title: "Якість сну", description: "Оцінка якості сну" },
    { id: 4, code: "anxiety_test", title: "Тривожність", description: "Оцінка рівня тривожності" },
];

const questionBank = {
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

let testResultId = 1;
let answerId = 1;
let adminId = 1;

const testResults = [];
const anonymousAnswers = [];

const { salt, hash } = hashPassword(ADMIN_PASSWORD);
const admins = [
    {
        id: adminId++,
        email: ADMIN_EMAIL,
        password_hash: hash,
        salt,
        institution: "Демо заклад",
        is_active: 1,
        created_at: new Date().toISOString(),
    },
];

function getTests() {
    return tests;
}

function findTestById(testId) {
    return tests.find((test) => test.id === Number(testId));
}

function addTestResult({ test_id, score, level }) {
    const result = {
        id: testResultId++,
        test_id: Number(test_id),
        score: Number(score),
        level,
        created_at: new Date().toISOString(),
    };
    testResults.push(result);
    return result;
}

function addAnonymousAnswers({ anonymous_session_id, test_code, answers = [] }) {
    const questions = questionBank[test_code] || [];

    answers.forEach((answerValue, index) => {
        if (!questions[index]) {
            return;
        }

        anonymousAnswers.push({
            id: answerId++,
            anonymous_session_id,
            test_code,
            question_order: index + 1,
            question_text: questions[index],
            answer_value: Number(answerValue),
            submitted_at: new Date().toISOString(),
        });
    });
}

function findAdminByEmail(email) {
    return admins.find((admin) => admin.email === email);
}

function addAdmin({ email, password_hash, salt: adminSalt, institution }) {
    const newAdmin = {
        id: adminId++,
        email,
        password_hash,
        salt: adminSalt,
        institution,
        is_active: 1,
        created_at: new Date().toISOString(),
    };

    admins.push(newAdmin);
    return newAdmin;
}

function getAdminPublicFields(email) {
    const admin = findAdminByEmail(email);
    if (!admin) {
        return null;
    }

    return {
        id: admin.id,
        email: admin.email,
        institution: admin.institution,
        is_active: admin.is_active,
        created_at: admin.created_at,
    };
}

function getStats() {
    const total_submissions = testResults.length;
    const overall_avg_score = total_submissions
        ? Number((testResults.reduce((sum, row) => sum + Number(row.score), 0) / total_submissions).toFixed(1))
        : 0;

    const testsStats = tests.map((test) => {
        const rows = testResults.filter((row) => row.test_id === test.id);
        const scores = rows.map((row) => Number(row.score));

        return {
            id: test.id,
            code: test.code,
            title: test.title,
            submissions: rows.length,
            avg_score: rows.length
                ? Number((scores.reduce((sum, value) => sum + value, 0) / rows.length).toFixed(1))
                : 0,
            min_score: rows.length ? Math.min(...scores) : 0,
            max_score: rows.length ? Math.max(...scores) : 0,
        };
    });

    const questionStats = [];
    Object.entries(questionBank).forEach(([testCode, questions]) => {
        questions.forEach((questionText, idx) => {
            const questionOrder = idx + 1;
            const answers = anonymousAnswers.filter(
                (answer) => answer.test_code === testCode && answer.question_order === questionOrder
            );
            const avg_answer_value = answers.length
                ? Number(
                      (
                          answers.reduce((sum, answer) => sum + Number(answer.answer_value), 0) / answers.length
                      ).toFixed(2)
                  )
                : 0;

            questionStats.push({
                test_code: testCode,
                question_order: questionOrder,
                question_text: questionText,
                answers_count: answers.length,
                avg_answer_value,
            });
        });
    });

    return {
        overall: { total_submissions, overall_avg_score },
        testsStats,
        questionStats,
    };
}

module.exports = {
    getTests,
    findTestById,
    addTestResult,
    addAnonymousAnswers,
    findAdminByEmail,
    addAdmin,
    getAdminPublicFields,
    getStats,
};
