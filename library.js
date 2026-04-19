document.addEventListener("DOMContentLoaded", async () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const loginPrompt = document.getElementById("library-login-prompt");

  if (isLoggedIn) {
    loginPrompt.style.display = "none";
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const response = await fetch(`/api/scores/user/${user.id}`);
        if (response.ok) {
          const scores = await response.json();
          scores.forEach((s) => {
            const el = document.getElementById(`score-${s.gameName}`);
            if (el) {
              el.textContent = s.score + " pts";
              el.style.color = "#000";
              el.style.fontWeight = "bold";
            }
          });
        }
      } catch (e) {
        console.error("Erreur de récupération des scores", e);
      }
    }
  }
});
