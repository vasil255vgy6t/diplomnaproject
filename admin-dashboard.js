function renderStatsTable(rows) {
    const body = document.getElementById("stats-table-body");
    body.innerHTML = "";

    rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.title}</td>
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.submissions}</td>
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.avg_score}%</td>
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.min_score}%</td>
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.max_score}%</td>
        `;
        body.appendChild(tr);
    });
}

function renderQuestionStats(rows) {
    const body = document.getElementById("question-stats-body");
    body.innerHTML = "";

    rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.test_code}</td>
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.question_order}</td>
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.question_text}</td>
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.answers_count}</td>
            <td style="padding: 10px; border-top: 1px solid #dbe4ff;">${row.avg_answer_value}</td>
        `;
        body.appendChild(tr);
    });
}

async function loadAdminStats() {
    if (!requireAdminLogin()) {
        return;
    }

    try {
        const token = getAdminToken();
        const response = await fetch("http://localhost:3000/api/admin/stats", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            clearAdminSession();
            window.location.href = "login.html";
            return;
        }

        const data = await response.json();

        document.getElementById("total-submissions").textContent = data.overall.total_submissions;
        document.getElementById("overall-avg").textContent = `${data.overall.overall_avg_score}%`;
        renderStatsTable(data.testsStats);
        renderQuestionStats(data.questionStats || []);
    } catch (error) {
        console.error("Помилка завантаження статистики:", error);
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

loadAdminStats();
