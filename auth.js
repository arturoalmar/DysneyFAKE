document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleLink = document.getElementById('toggleLink');
    const toggleText = document.getElementById('toggleText');
    const authError = document.getElementById('authError');
    const pageOverlay = document.getElementById('pageOverlay');

    const API_URL = 'http://localhost:3000/api/auth';

    const showError = (msg) => {
        authError.textContent = msg;
        authError.style.display = 'block';
    };

    const hideError = () => {
        authError.style.display = 'none';
    };

    // Toggle between login and register
    toggleLink.addEventListener('click', () => {
        hideError();
        if (loginForm.style.display === 'none') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            toggleText.innerHTML = '¿No tienes cuenta? <a id="toggleLink">Regístrate</a>';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            toggleText.innerHTML = '¿Ya tienes cuenta? <a id="toggleLink">Inicia sesión</a>';
        }
        // Re-attach event because innerHTML replaces the link
        document.getElementById('toggleLink').addEventListener('click', arguments.callee);
        setupPasswordToggle();
    });

    // Login logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const identifier = document.getElementById('loginIdentifier').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const data = await res.json();

            if (data.ok) {
                localStorage.setItem('user', JSON.stringify(data.user));
                pageOverlay.classList.add('active');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 600);
            } else {
                showError(data.error === 'invalid_credentials' ? 'Credenciales incorrectas' : 'Error al iniciar sesión');
            }
        } catch (err) {
            showError('Sin conexión con el servidor');
        }
    });

    // Register logic
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();

        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();

            if (data.ok) {
                // Auto login after register
                const defaultAvatar = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXayQ6GHzZTBsE1twQYmvZtGF33757eePf8g&s';
                localStorage.setItem('user', JSON.stringify({ username, email, avatar: defaultAvatar }));
                pageOverlay.classList.add('active');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 600);
            } else {
                showError(data.error === 'user_already_exists' ? 'El usuario o email ya existen' : 'Error en el registro');
            }
        } catch (err) {
            showError('Sin conexión con el servidor');
        }
    });

    // --- LÓGICA DE MOSTRAR CONTRASEÑA ---
    const eyeOpenSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 10s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
            <line x1="12" y1="3" x2="12" y2="1"></line>
            <line x1="5" y1="5" x2="4" y2="3"></line>
            <line x1="19" y1="5" x2="20" y2="3"></line>
        </svg>
    `;

    const eyeClosedSvg = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3 7 10 7 10-7 10-7"></path>
            <line x1="12" y1="19" x2="12" y2="21"></line>
            <line x1="7" y1="17" x2="6" y2="19"></line>
            <line x1="17" y1="17" x2="18" y2="19"></line>
        </svg>
    `;

    const setupPasswordToggle = () => {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.onclick = () => {
                const input = button.previousElementSibling;
                if (input.type === 'password') {
                    input.type = 'text';
                    button.innerHTML = eyeClosedSvg;
                } else {
                    input.type = 'password';
                    button.innerHTML = eyeOpenSvg;
                }
            };
        });
    };

    setupPasswordToggle();
});
