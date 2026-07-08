const API_BASE = "/api";

function showMsg(text, type) {
    const el = document.getElementById("formMsg");
    el.textContent = text;
    el.className = "msg " + (type || "");
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showMsg("Email and password are required.", "error");
        return;
    }

    showMsg("Logging in...", "");

    try {
        const response = await fetch(API_BASE + "/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = text; }

        if (!response.ok) {
            showMsg(typeof data === "string" ? data : (data.message || "Login failed."), "error");
            return;
        }

        // Expecting a response like:
        // { token: "...", role: "CAMPAIGN_DIRECTOR", accountId: 12, email: "..." }
        const token = data.token || data.accessToken || "";
        const role = data.role || data.domainRole || "UNKNOWN";
        const accountId = data.accountId || data.id || "";

        if (!token) {
            showMsg("Login succeeded but no token was returned by the server.", "error");
            return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem("domainRole", role);
        localStorage.setItem("accountId", accountId);
        localStorage.setItem("email", email);

        showMsg("Login successful! Redirecting to dashboard...", "success");
        setTimeout(() => {
            window.location.href = "../db/db.html";
        }, 900);

    } catch (error) {
        showMsg("Network error: " + error.message, "error");
    }
});
