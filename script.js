const stressValue = document.getElementById("stress-value");
const sleepValue = document.getElementById("sleep-value");
const anxietyValue = document.getElementById("anxiety-value");

const stressStatus = document.getElementById("stress-status");
const sleepStatus = document.getElementById("sleep-status");
const anxietyStatus = document.getElementById("anxiety-status");

const bars = [
    document.getElementById("bar1"),
    document.getElementById("bar2"),
    document.getElementById("bar3"),
    document.getElementById("bar4"),
    document.getElementById("bar5"),
    document.getElementById("bar6"),
    document.getElementById("bar7")
];

function getStressStatus(value) {
    if (value === 0) return "Дані відсутні";
    if (value <= 33) return "Низький рівень";
    if (value <= 66) return "Помірний рівень";
    return "Високий рівень";
}

function getSleepStatus(value) {
    if (value === 0) return "Дані відсутні";
    if (value <= 33) return "Поганий стан";
    if (value <= 66) return "Середній стан";
    return "Хороший стан";
}

function getAnxietyStatus(value) {
    if (value === 0) return "Дані відсутні";
    if (value <= 33) return "Низький рівень";
    if (value <= 66) return "Помірний рівень";
    return "Високий рівень";
}

function updateDashboard(stress, sleep, anxiety) {
    stressValue.textContent = stress + "%";
    sleepValue.textContent = sleep + "%";
    anxietyValue.textContent = anxiety + "%";

    stressStatus.textContent = getStressStatus(stress);
    sleepStatus.textContent = getSleepStatus(sleep);
    anxietyStatus.textContent = getAnxietyStatus(anxiety);

    const chartData = [stress, sleep, anxiety, 20, 35, 50, 65];

    bars.forEach((bar, index) => {
        if (bar) {
            bar.style.height = chartData[index] + "%";
        }
    });
}

async function loadDashboard(userId = getCurrentUserId()) {
    if (!userId) {
        updateDashboard(0, 0, 0);
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/dashboard/${userId}`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            updateDashboard(0, 0, 0);
            return;
        }

        let stress = 0;
        let sleep = 0;
        let anxiety = 0;

        data.results.forEach((item) => {
            if (item.code === "stress_test" && stress === 0) {
                stress = item.score;
            }

            if (item.code === "sleep_test" && sleep === 0) {
                sleep = item.score;
            }

            if (item.code === "anxiety_test" && anxiety === 0) {
                anxiety = item.score;
            }
        });

        updateDashboard(stress, sleep, anxiety);
    } catch (error) {
        console.error("Помилка завантаження dashboard:", error);
        updateDashboard(0, 0, 0);
    }
}

loadDashboard();
function getStressLevel(rawScore) {
    if (rawScore <= 6) return "Низький рівень";
    if (rawScore <= 13) return "Помірний рівень";
    return "Високий рівень";
}

function calculateStressPercent(rawScore) {
    return Math.round((rawScore / 20) * 100);
}

async function submitStressTest() {
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
    const percentScore = calculateStressPercent(rawScore);
    const level = getStressLevel(rawScore);

    const resultText = document.getElementById("stress-result-text");
    resultText.textContent = `Твій результат: ${percentScore}% — ${level}.`;

    try {
        const response = await fetch("http://localhost:3000/api/test-results", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: 1,
                test_id: 1,
                score: percentScore,
                level: level
            })
        });

        const data = await response.json();
        console.log("Результат стрес-тесту збережено:", data);

        await loadDashboard(1);

        alert("Результат тесту успішно збережено!");
    } catch (error) {
        console.error("Помилка при збереженні стрес-тесту:", error);
        alert("Не вдалося зберегти результат тесту.");
    }
}