function showAuthMessage(text, isError = false) {
    const messageEl = document.getElementById("authMessage");
    messageEl.textContent = text;
    messageEl.style.display = "block";
    messageEl.style.background = isError ? "rgba(255, 170, 170, 0.25)" : "rgba(110, 142, 245, 0.15)";
    messageEl.style.color = isError ? "#9c1f1f" : "#1f2a44";
}

async function adminLogin() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        showAuthMessage("Будь ласка, заповніть всі поля.", true);
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
            showAuthMessage(result.message || "Не вдалося увійти.", true);
            return;
        }

        setAdminToken(result.token);
        showAuthMessage("Успішний вхід адміністратора! Переадресація...", false);
        setTimeout(() => (window.location.href = "admin-dashboard.html"), 900);
    } catch (error) {
        console.error(error);
        showAuthMessage("Помилка при вході. Спробуйте пізніше.", true);
    }
}
