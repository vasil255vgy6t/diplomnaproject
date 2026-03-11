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

function setAdminOnlyStatus() {
    stressStatus.textContent = "Статистика доступна адміністрації";
    sleepStatus.textContent = "Статистика доступна адміністрації";
    anxietyStatus.textContent = "Статистика доступна адміністрації";
}

async function loadDashboard() {
    const token = getAdminToken();

    if (!token) {
        updateDashboard(0, 0, 0);
        setAdminOnlyStatus();
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/admin/stats", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            updateDashboard(0, 0, 0);
            setAdminOnlyStatus();
            return;
        }

        const data = await response.json();
        const byCode = Object.fromEntries(data.testsStats.map((item) => [item.code, item]));

        const stress = Number(byCode.stress_test?.avg_score || 0);
        const sleep = Number(byCode.sleep_test?.avg_score || 0);
        const anxiety = Number(byCode.anxiety_test?.avg_score || 0);

        updateDashboard(stress, sleep, anxiety);
    } catch (error) {
        console.error("Помилка завантаження dashboard:", error);
        updateDashboard(0, 0, 0);
        setAdminOnlyStatus();
    }
}

loadDashboard();
