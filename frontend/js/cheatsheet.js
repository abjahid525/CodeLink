import { initTheme } from './theme.js';

const CHEAT_SHEETS = [
  {
    title: 'JavaScript Arrays',
    code: `const nums = [1, 2, 3]\nconst doubled = nums.map((n) => n * 2)\nconst total = nums.reduce((sum, n) => sum + n, 0)`
  },
  {
    title: 'Fetch JSON',
    code: `const response = await fetch('/api/items')\nif (!response.ok) throw new Error('Request failed')\nconst data = await response.json()`
  },
  {
    title: 'CSS Grid Layout',
    code: `.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n  gap: 1rem;\n}`
  },
  {
    title: 'Node Express Route',
    code: `app.get('/api/health', (req, res) => {\n  res.json({ ok: true, timestamp: Date.now() })\n})`
  },
  {
    title: 'Debounce Input',
    code: `function debounce(fn, delay = 200) {\n  let id\n  return (...args) => {\n    clearTimeout(id)\n    id = setTimeout(() => fn(...args), delay)\n  }\n}`
  },
  {
    title: 'LocalStorage Safe Parse',
    code: `function safeJson(raw) {\n  try {\n    return JSON.parse(raw)\n  } catch {\n    return null\n  }\n}`
  }
];

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getStoredUser() {
  const raw = localStorage.getItem('codelink-user');
  return raw ? JSON.parse(raw) : null;
}

function clearUser() {
  localStorage.removeItem('codelink-user');
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
      setTimeout(() => (window.location.href = 'login.html'), 1000);
    });
  }
}

function renderCheatSheets(items) {
  const list = document.getElementById('cheat-list');
  if (!list) return;

  if (!items.length) {
    list.innerHTML = '<p class="cheat-card">No cheat sheets match your search.</p>';
    return;
  }

  list.innerHTML = items
    .map(
      (item) => `
      <article class="cheat-card">
        <h3>${escapeHtml(item.title)}</h3>
        <pre><code>${escapeHtml(item.code)}</code></pre>
      </article>
    `
    )
    .join('');
}

function initSearch() {
  const search = document.getElementById('search-cheat');
  if (!search) return;

  search.addEventListener('input', () => {
    const query = search.value.toLowerCase().trim();
    const filtered = CHEAT_SHEETS.filter((item) => {
      return item.title.toLowerCase().includes(query) || item.code.toLowerCase().includes(query);
    });
    renderCheatSheets(filtered);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkAuth();
  initLogout();
  renderCheatSheets(CHEAT_SHEETS);
  initSearch();
});
