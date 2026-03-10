function getCurrentUserId() {
    const id = localStorage.getItem("user_id");
    return id ? Number(id) : 0;
}

function setCurrentUserId(id) {
    localStorage.setItem("user_id", String(id));
}

function clearCurrentUser() {
    localStorage.removeItem("user_id");
}

function requireLogin(redirectTo = "login.html") {
    if (!getCurrentUserId()) {
        window.location.href = redirectTo;
        return false;
    }
    return true;
}
