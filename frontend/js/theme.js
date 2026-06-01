const THEME_KEY = 'codelink-theme';
const LIGHT_LABEL = 'Switch to Dark Mode';
const DARK_LABEL = 'Switch to Light Mode';

function getStoredTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

function applyTheme(theme) {
  document.body.classList.toggle('light-mode', theme === 'light');
  localStorage.setItem(THEME_KEY, theme);
}

function updateThemeButton() {
  const button = document.getElementById('theme-toggle-button');
  if (!button) return;
  button.textContent = document.body.classList.contains('light-mode') ? LIGHT_LABEL : DARK_LABEL;
}

function showThemeToast(theme) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = theme === 'light' ? 'Light theme enabled' : 'Dark theme enabled';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
  updateThemeButton();

  const button = document.getElementById('theme-toggle-button');
  if (!button) return;

  button.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
    applyTheme(nextTheme);
    updateThemeButton();
    showThemeToast(nextTheme);
  });
}
