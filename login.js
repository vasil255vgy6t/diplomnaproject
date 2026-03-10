function showLogin() {
    document.getElementById("loginForm").classList.remove("auth-form--hidden");
    document.getElementById("registerForm").classList.add("auth-form--hidden");
    document.getElementById("loginTab").classList.add("auth-tab--active");
    document.getElementById("registerTab").classList.remove("auth-tab--active");
    clearAuthMessage();
}

function showRegister() {
    document.getElementById("loginForm").classList.add("auth-form--hidden");
    document.getElementById("registerForm").classList.remove("auth-form--hidden");
    document.getElementById("loginTab").classList.remove("auth-tab--active");
    document.getElementById("registerTab").classList.add("auth-tab--active");
    clearAuthMessage();
}

function showAuthMessage(text, isError = false) {
    const messageEl = document.getElementById("authMessage");
    messageEl.textContent = text;
    messageEl.style.display = "block";
    messageEl.style.background = isError ? "rgba(255, 170, 170, 0.25)" : "rgba(110, 142, 245, 0.15)";
    messageEl.style.color = isError ? "#9c1f1f" : "#1f2a44";
}

function clearAuthMessage() {
    const messageEl = document.getElementById("authMessage");
    messageEl.style.display = "none";
    messageEl.textContent = "";
}

async function registerUser() {
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("registerPasswordConfirm").value;

    if (!email || !password || !confirm) {
        showAuthMessage("Будь ласка, заповніть всі поля.", true);
        return;
    }

    if (password !== confirm) {
        showAuthMessage("Паролі не співпадають.", true);
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            showAuthMessage(result.message || "Не вдалося зареєструватися.", true);
            return;
        }

        setCurrentUserId(result.user_id);
        showAuthMessage("Реєстрація успішна! Переадресація...", false);
        setTimeout(() => (window.location.href = "index.html"), 900);
    } catch (error) {
        console.error(error);
        showAuthMessage("Помилка при реєстрації. Спробуйте пізніше.", true);
    }
}

async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        showAuthMessage("Будь ласка, заповніть всі поля.", true);
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            showAuthMessage(result.message || "Не вдалося увійти.", true);
            return;
        }

        setCurrentUserId(result.user_id);
        showAuthMessage("Успішний вхід! Переадресація...", false);
        setTimeout(() => (window.location.href = "index.html"), 900);
    } catch (error) {
        console.error(error);
        showAuthMessage("Помилка при вході. Спробуйте пізніше.", true);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    showLogin();
});
