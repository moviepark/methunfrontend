const API_BASE = "https://methunbackend.onrender.com/api";

function showMsg(text, type) {
    const el = document.getElementById("formMsg");
    el.textContent = text;
    el.className = "msg " + (type || "");
}

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = document.getElementById("role").value;

    if (!fullName || !email || !password || !confirmPassword) {
        showMsg("All fields are required.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMsg("Passwords do not match.", "error");
        return;
    }

    if (password.length < 6) {
        showMsg("Password must be at least 6 characters.", "error");
        return;
    }

    const body = {
        fullName: fullName,
        email: email,
        password: password,
        role: role
    };

    showMsg("Creating your account...", "");

    try {
        const response = await fetch(API_BASE + "/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } catch (e) { data = text; }

        if (!response.ok) {
            showMsg(typeof data === "string" ? data : (data.message || "Registration failed."), "error");
            return;
        }

        showMsg("Account created successfully! Redirecting to login...", "success");
        setTimeout(() => {
            window.location.href = "../login/login.html";
        }, 1200);

    } catch (error) {
        showMsg("Network error: " + error.message, "error");
    }
});
