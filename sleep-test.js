function getSleepLevel(rawScore) {
    if (rawScore <= 6) return "Поганий стан";
    if (rawScore <= 13) return "Середній стан";
    return "Хороший стан";
}

function calculateSleepPercent(rawScore) {
    return Math.round((rawScore / 20) * 100);
}

function getSleepAdvice(level) {
    if (level === "Хороший стан") {
        return "Ти добре висипаєшся. Продовжуй тримати стабільний режим сну та відпочинку.";
    }

    if (level === "Середній стан") {
        return "Твій сон може бути кращим. Спробуй лягати і вставати в один час, а також зменшувати екранний час перед сном.";
    }

    return "Твій сон потребує уваги. Спробуй створити комфортні умови для сну, зменшити стрес перед сном і звернути увагу на режим.";
}

async function submitSleepTest() {
    const userId = getCurrentUserId();
    if (!userId) {
        alert("Будь ласка, увійдіть, щоб пройти тест.");
        window.location.href = "login.html";
        return;
    }

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
    const percentScore = calculateSleepPercent(rawScore);
    const level = getSleepLevel(rawScore);

    try {
        const response = await fetch("http://localhost:3000/api/test-results", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: userId,
                test_id: 3,
                score: percentScore,
                level: level
            })
        });

        const data = await response.json();
        console.log("Результат тесту на сон збережено:", data);

        document.getElementById("stress-result-box").style.display = "block";
        document.getElementById("stress-result-text").textContent =
            `Твій результат: ${percentScore}% — ${level}.`;
        document.getElementById("stress-advice-text").textContent = getSleepAdvice(level);

        document.getElementById("stress-test-form").style.display = "none";
    } catch (error) {
        console.error("Помилка при збереженні тесту:", error);
        alert("Не вдалося зберегти результат тесту.");
    }
}

function goToHomePage() {
    window.location.href = "index.html#dashboard";
}
