document.addEventListener("DOMContentLoaded", () => {
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
