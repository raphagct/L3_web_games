document.addEventListener("DOMContentLoaded", () => {
  const currentUserStr = localStorage.getItem("currentUser");
  if (currentUserStr) {
    try {
      const user = JSON.parse(currentUserStr);
      document.getElementById("prof-username").textContent = user.username;
      document.getElementById("prof-email").textContent = user.email;
    } catch (e) {}
  } else {
    window.location.href = "login.html";
  }

  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    window.location.href = "index.html";
  });
});
