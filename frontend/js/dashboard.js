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

function clearUser() {
  localStorage.removeItem('codelink-user');
  localStorage.removeItem('codelink-token');
}

function checkAuth() {
  const user = getStoredUser();
  if (!user) {
    window.location.href = 'login.html';
  }
}

function initLogout() {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      clearUser();
      showToast('You have been logged out.');
      setTimeout(() => window.location.href = 'login.html', 1000);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth();
  initLogout();
});