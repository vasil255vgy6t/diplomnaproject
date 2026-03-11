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
    if (value === 0) return "Пройди тест";
    if (value <= 33) return "Низький рівень";
    if (value <= 66) return "Помірний рівень";
    return "Високий рівень";
}

function getSleepStatus(value) {
    if (value === 0) return "Пройди тест";
    if (value <= 33) return "Поганий стан";
    if (value <= 66) return "Середній стан";
    return "Хороший стан";
}

function getAnxietyStatus(value) {
    if (value === 0) return "Пройди тест";
    if (value <= 33) return "Низький рівень";
    if (value <= 66) return "Помірний рівень";
    return "Високий рівень";
}

function updateDashboard(stress, sleep, anxiety) {
    stressValue.textContent = `${stress}%`;
    sleepValue.textContent = `${sleep}%`;
    anxietyValue.textContent = `${anxiety}%`;

    stressStatus.textContent = getStressStatus(stress);
    sleepStatus.textContent = getSleepStatus(sleep);
    anxietyStatus.textContent = getAnxietyStatus(anxiety);

    const chartData = [stress, sleep, anxiety, 20, 35, 50, 65];
    bars.forEach((bar, index) => {
        if (bar) {
            bar.style.height = `${chartData[index]}%`;
        }
    });
}

function showPromptToTakeTests() {
    stressStatus.textContent = "Доступно після проходження тесту";
    sleepStatus.textContent = "Доступно після проходження тесту";
    anxietyStatus.textContent = "Доступно після проходження тесту";
}

function loadDashboardFromLatestResults() {
    if (!hasCompletedAnyTest()) {
        updateDashboard(0, 0, 0);
        showPromptToTakeTests();
        return;
    }

    const latest = getLatestTestResults();
    const stress = Number(latest.stress_test?.score || 0);
    const sleep = Number(latest.sleep_test?.score || 0);
    const anxiety = Number(latest.anxiety_test?.score || 0);

    updateDashboard(stress, sleep, anxiety);
}

loadDashboardFromLatestResults();
