import { initEditor } from './editor.js';
import { initSnippets } from './snippets-component.js';
import { initForum } from './forum-component.js';
import { initMatchmaker } from './matchmaker-component.js';

const themeToggle = document.querySelector('#theme-toggle');
const cheatButton = document.querySelector('#cheat-button');
const cheatModal = document.querySelector('#cheat-modal');
const closeCheat = document.querySelector('#close-cheat');
const toastEl = document.querySelector('#toast');

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

function setupNavigation() {
  document.querySelectorAll('.nav-links button').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

const registerForm = document.querySelector('#register-form');
const loginForm = document.querySelector('#login-form');
const authStatus = document.querySelector('#auth-status');
const registerNameInput = document.querySelector('#register-name');
const registerEmailInput = document.querySelector('#register-email');
const registerPasswordInput = document.querySelector('#register-password');
const registerRoleSelect = document.querySelector('#register-role');
const loginEmailInput = document.querySelector('#login-email');
const loginPasswordInput = document.querySelector('#login-password');
const logoutButton = document.querySelector('#logout-button');

const AUTH_STORAGE_KEY = 'codelink-user';
const AUTH_API = '/api/auth';

function getStoredUser() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveUser(user) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function updateAuthPanel(user) {
  if (user) {
    authStatus.innerHTML = `<p>Signed in as <strong>${user.name}</strong> (<em>${user.role}</em>)</p>`;
    registerForm.classList.add('hidden');
    loginForm.classList.add('hidden');
    logoutButton.classList.remove('hidden');
  } else {
    authStatus.innerHTML = '<p>Register or login as a student, teacher, or admin to personalize your experience.</p>';
    registerForm.classList.remove('hidden');
    loginForm.classList.remove('hidden');
    logoutButton.classList.add('hidden');
  }
}

async function submitRegisterForm(event) {
  event.preventDefault();
  const name = registerNameInput.value.trim();
  const email = registerEmailInput.value.trim();
  const password = registerPasswordInput.value.trim();
  const role = registerRoleSelect.value;

  if (!name || !email || !password || !role) {
    showToast('All registration fields are required.');
    return;
  }

  try {
    const response = await fetch(`${AUTH_API}/register`, {
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
    updateAuthPanel(data);
    registerForm.reset();
    showToast(`Welcome, ${data.name}! You are signed in as ${data.role}.`);
  } catch (error) {
    showToast('Registration error. Try again later.');
    console.error(error);
  }
}

async function submitLoginForm(event) {
  event.preventDefault();
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value.trim();

  if (!email || !password) {
    showToast('Email and password are required.');
    return;
  }

  try {
    const response = await fetch(`${AUTH_API}/login`, {
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
    updateAuthPanel(data);
    loginForm.reset();
    showToast(`Welcome back, ${data.name}!`);
  } catch (error) {
    showToast('Login error. Try again later.');
    console.error(error);
  }
}

function initAuth(showToast) {
  const currentUser = getStoredUser();
  updateAuthPanel(currentUser);

  registerForm.addEventListener('submit', submitRegisterForm);
  loginForm.addEventListener('submit', submitLoginForm);
  logoutButton.addEventListener('click', () => {
    clearUser();
    updateAuthPanel(null);
    registerForm.reset();
    loginForm.reset();
    showToast('You have been logged out.');
  });
}

function setupCheatSheet() {
  cheatButton.addEventListener('click', () => cheatModal.classList.remove('hidden'));
  closeCheat.addEventListener('click', () => cheatModal.classList.add('hidden'));
  cheatModal.addEventListener('click', (event) => {
    if (event.target === cheatModal) cheatModal.classList.add('hidden');
  });
}

function setupThemeToggle() {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    themeToggle.textContent = isLight ? 'Dark Mode' : 'Light Mode';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupCheatSheet();
  setupThemeToggle();

  initAuth(showToast);
  initEditor(showToast);
  initSnippets(showToast);
  initForum(showToast);
  initMatchmaker(showToast);
});
