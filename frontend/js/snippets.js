import { initSnippets } from './snippets-component.js';
import { initTheme } from './theme.js';
import { clearSession, requireAuth } from './auth-utils.js';

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function checkAuth() {
  requireAuth();
}

function initLogout() {
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      clearSession();
      showToast('You have been logged out.');
      setTimeout(() => window.location.href = 'login.html', 1000);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth();
  initLogout();
  initSnippets(showToast);
});
