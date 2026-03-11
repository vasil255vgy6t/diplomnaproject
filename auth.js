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
