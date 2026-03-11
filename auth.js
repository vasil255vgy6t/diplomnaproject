function getAdminToken() {
    return localStorage.getItem("admin_token") || "";
}

function setAdminToken(token) {
    localStorage.setItem("admin_token", token);
}

function clearAdminSession() {
    localStorage.removeItem("admin_token");
}

function isAdminLoggedIn() {
    return Boolean(getAdminToken());
}

function requireAdminLogin(redirectTo = "login.html") {
    if (!isAdminLoggedIn()) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}

function saveLatestTestResult(testCode, score, level) {
    const raw = localStorage.getItem("latest_test_results");
    const parsed = raw ? JSON.parse(raw) : {};

    parsed[testCode] = {
        score,
        level,
        savedAt: new Date().toISOString(),
    };

    localStorage.setItem("latest_test_results", JSON.stringify(parsed));
    localStorage.setItem("has_completed_test", "1");
}

function getLatestTestResults() {
    const raw = localStorage.getItem("latest_test_results");
    return raw ? JSON.parse(raw) : {};
}

function hasCompletedAnyTest() {
    return localStorage.getItem("has_completed_test") === "1";
}
