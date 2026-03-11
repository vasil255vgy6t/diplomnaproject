function getStressLevel(rawScore) {
    if (rawScore <= 6) return "Низький рівень";
    if (rawScore <= 13) return "Помірний рівень";
    return "Високий рівень";
}

function calculateStressPercent(rawScore) {
    return Math.round((rawScore / 20) * 100);
}

function getStressAdvice(level) {
    if (level === "Низький рівень") {
        return "У тебе низький рівень стресу. Намагайся й надалі підтримувати баланс між навчанням і відпочинком.";
    }

    if (level === "Помірний рівень") {
        return "У тебе помірний рівень стресу. Спробуй краще розподіляти навантаження, робити короткі перерви та не відкладати справи на останній момент.";
    }

    return "У тебе високий рівень стресу. Варто зменшити перевантаження, більше відпочивати, використовувати техніки дихання та, за потреби, звернутися по підтримку.";
}

async function submitStressTest() {
    const answers = [];
    const anonymousSessionId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    for (let i = 1; i <= 5; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);

        if (!selected) {
            alert("Будь ласка, дай відповідь на всі запитання.");
            return;
        }

        answers.push(Number(selected.value));
    }

    const rawScore = answers.reduce((sum, value) => sum + value, 0);
    const percentScore = calculateStressPercent(rawScore);
    const level = getStressLevel(rawScore);
    const advice = getStressAdvice(level);

    try {
        const response = await fetch("http://localhost:3000/api/test-results", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                test_id: 1,
                score: percentScore,
                level: level,
                answers: answers,
                anonymous_session_id: anonymousSessionId
            })
        });

        const data = await response.json();
        saveLatestTestResult("stress_test", percentScore, level);
        console.log("Результат тесту збережено:", data);

        document.getElementById("stress-result-box").style.display = "block";
        document.getElementById("stress-result-text").textContent =
            `Твій результат: ${percentScore}% — ${level}.`;
        document.getElementById("stress-advice-text").textContent = advice;

        document.getElementById("stress-test-form").style.display = "none";
    } catch (error) {
        console.error("Помилка при збереженні тесту:", error);
        alert("Не вдалося зберегти результат тесту.");
    }
}
function goToHomePage() {
    window.location.href = "index.html#dashboard";
}