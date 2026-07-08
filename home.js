// Simple mobile nav toggle + login-aware nav label
document.addEventListener("DOMContentLoaded", () => {
    const burger = document.getElementById("burger");
    const links = document.querySelector(".nav-links");

    burger.addEventListener("click", () => {
        links.style.display = links.style.display === "flex" ? "none" : "flex";
        links.style.flexDirection = "column";
        links.style.position = "absolute";
        links.style.top = "64px";
        links.style.right = "7%";
        links.style.background = "#0f172a";
        links.style.border = "1px solid #334155";
        links.style.borderRadius = "12px";
        links.style.padding = "16px";
    });

    const token = localStorage.getItem("token");
    const loginLink = document.querySelector('.nav-links a[href*="login"]');
    if (token && loginLink) {
        loginLink.textContent = "Logout";
        loginLink.href = "#";
        loginLink.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.reload();
        });
    }
});
