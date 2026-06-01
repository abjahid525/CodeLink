import { initTheme } from './theme.js';

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function getStoredUser() {
  const raw = localStorage.getItem('codelink-user');
  return raw ? JSON.parse(raw) : null;
}

function saveUser(user) {
  localStorage.setItem('codelink-user', JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem('codelink-user');
  localStorage.removeItem('codelink-token');
}

async function submitLoginForm(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) {
    showToast('Email and password are required.');
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      showToast(data?.error || 'Unable to login.');
      return;
    }

    saveUser(data);
    localStorage.setItem('codelink-token', data.token);
    showToast(`Welcome back, ${data.name}!`);
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
  } catch (error) {
    showToast('Login error. Try again later.');
    console.error(error);
  }
}

async function submitRegisterForm(event) {
  event.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value.trim();
  const role = document.getElementById('register-role').value;

  if (!name || !email || !password || !role) {
    showToast('All registration fields are required.');
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await response.json();
    if (!response.ok) {
      showToast(data?.error || 'Unable to register.');
      return;
    }

    saveUser(data);
    localStorage.setItem('codelink-token', data.token);
    showToast(`Welcome, ${data.name}! You are signed in as ${data.role}.`);
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
  } catch (error) {
    showToast('Registration error. Try again later.');
    console.error(error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Check if running from file:// protocol
  if (window.location.protocol === 'file:') {
    console.error('CodeLink must be accessed via HTTP server, not file:// protocol');
    showToast('Please access CodeLink via http://localhost:4000, not by opening files directly');
    return;
  }

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  initTheme();

  if (loginForm) {
    loginForm.addEventListener('submit', submitLoginForm);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', submitRegisterForm);
  }
});
