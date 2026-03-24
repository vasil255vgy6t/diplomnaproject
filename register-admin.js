function showRegisterMessage(text, isError = false) {
    const messageEl = document.getElementById("registerMessage");
    messageEl.textContent = text;
    messageEl.style.display = "block";
    messageEl.style.background = isError ? "rgba(255, 170, 170, 0.25)" : "rgba(110, 142, 245, 0.15)";
    messageEl.style.color = isError ? "#9c1f1f" : "#1f2a44";
}

function getInstitutionValue() {
    const selectValue = document.getElementById("institutionSelect").value;
    const customValue = document.getElementById("customInstitution").value.trim();

    if (selectValue === "__custom__") {
        return customValue;
    }

    return selectValue;
}

function onInstitutionChange() {
    const selectValue = document.getElementById("institutionSelect").value;
    const customWrapper = document.getElementById("customInstitutionWrapper");

    customWrapper.style.display = selectValue === "__custom__" ? "block" : "none";
}

async function registerAdmin() {
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const institution = getInstitutionValue();

    if (!email || !password || !institution) {
        showRegisterMessage("Будь ласка, заповніть всі поля.", true);
        return;
    }

    if (password.length < 6) {
        showRegisterMessage("Пароль має містити щонайменше 6 символів.", true);
        return;
    }

    try {
        const token = getAdminToken();
        const response = await fetch("http://localhost:3000/api/admin/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ email, password, institution }),
        });

        const result = await response.json();

        if (!response.ok) {
            showRegisterMessage(result.message || "Не вдалося зареєструвати адміністратора.", true);
            return;
        }

        showRegisterMessage("Адміністратора успішно створено.", false);
        document.getElementById("registerEmail").value = "";
        document.getElementById("registerPassword").value = "";
        document.getElementById("institutionSelect").value = "";
        document.getElementById("customInstitution").value = "";
        onInstitutionChange();
    } catch (error) {
        console.error(error);
        showRegisterMessage("Помилка з'єднання. Спробуйте пізніше.", true);
    }
}

async function logoutAdmin() {
    const token = getAdminToken();

    if (token) {
        try {
            await fetch("http://localhost:3000/api/admin/logout", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error("Помилка виходу:", error);
        }
    }

    clearAdminSession();
    window.location.href = "login.html";
}

if (!requireAdminLogin()) {
    // redirect handled in helper
} else {
    document.getElementById("institutionSelect").addEventListener("change", onInstitutionChange);
}
