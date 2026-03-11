function getAnxietyTestLevel(rawScore) {
    if (rawScore <= 6) return "Низький рівень";
    if (rawScore <= 13) return "Помірний рівень";
    return "Високий рівень";
}

function calculateAnxietyPercent(rawScore) {
    return Math.round((rawScore / 20) * 100);
}

function getAnxietyAdvice(level) {
    if (level === "Низький рівень") {
        return "У тебе низький рівень тривожності. Продовжуй піклуватися про себе та виконувати корисні практики для спокою.";
    }

    if (level === "Помірний рівень") {
        return "У тебе помірний рівень тривожності. Спробуй дихальні вправи, короткі перерви та говори з близькими про свої переживання.";
    }

    return "У тебе високий рівень тривожності. Варто звернути увагу на методи релаксації, звернутися до спеціаліста або поговорити з близькими.";
}

async function submitAnxietyTest() {
    const answers = [];

    for (let i = 1; i <= 5; i++) {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);

        if (!selected) {
            alert("Будь ласка, дай відповідь на всі запитання.");
            return;
        }

        answers.push(Number(selected.value));
    }

    const rawScore = answers.reduce((sum, value) => sum + value, 0);
    const percentScore = calculateAnxietyPercent(rawScore);
    const level = getAnxietyTestLevel(rawScore);

    try {
        const response = await fetch("http://localhost:3000/api/test-results", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                test_id: 4,
                score: percentScore,
                level: level
            })
        });

        const data = await response.json();
        console.log("Результат тесту тривожності збережено:", data);

        document.getElementById("stress-result-box").style.display = "block";
        document.getElementById("stress-result-text").textContent =
            `Твій результат: ${percentScore}% — ${level}.`;
        document.getElementById("stress-advice-text").textContent = getAnxietyAdvice(level);

        document.getElementById("stress-test-form").style.display = "none";
    } catch (error) {
        console.error("Помилка при збереженні тесту:", error);
        alert("Не вдалося зберегти результат тесту.");
    }
}

function goToHomePage() {
    window.location.href = "index.html#dashboard";
}
