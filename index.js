const toogle = document.getElementById('toogle');
const navbar = document.getElementById('navbar');


if (toogle && navbar) {
  toogle.addEventListener('click', () => {
    navbar.classList.toggle('sidebar');
    toogle.classList.toggle('toogle-active');
  });
}

const loginForm = document.getElementById('form-login');
const registerForm = document.getElementById('form-register');

if (loginForm && registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            alert("Les mots de passe ne correspondent pas!");
            return;
        }

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Inscription reussie! Veuillez vous connecter.");
                registerForm.reset();
                if (typeof toggleAuth === 'function') {
                    toggleAuth();
                } else {
                     document.getElementById('login-form').classList.remove('hidden');
                     document.getElementById('register-form').classList.add('hidden');
                }
            } else {
                alert(data.message || "Erreur lors de l'inscription");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur de connexion au serveur");
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Bienvenue, ${data.user.username}!`);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                window.location.href = 'index.html'; 
            } else {
                alert(data.message || "Email ou mot de passe incorrect!");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur de connexion au serveur");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        // Met à jour le bouton de connexion en bouton de profil
        const loginBtn = document.querySelector('.btn-login');
        if (loginBtn) {
            loginBtn.href = 'profile.html';
            loginBtn.textContent = 'Profil';
        }
    }
});
