import { authHeaders } from './auth-utils.js';

const API_URL = '/api/snippets';

function escapeHtml(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchSnippets() {
  const response = await fetch(API_URL, {
    headers: authHeaders()
  });
  if (!response.ok) {
    throw new Error('Unable to load your private snippets');
  }
  return response.json();
}

async function saveSnippet(snippet) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(snippet)
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || 'Unable to save snippet');
  }
  return data;
}

function renderSnippets(snippets) {
  const container = document.querySelector('#snippet-list');
  container.innerHTML = '';

  if (!snippets.length) {
    container.innerHTML = '<p class="snippet-card">Your private library is empty. Save your first snippet above.</p>';
    return;
  }

  snippets.forEach((snippet) => {
    const language = String(snippet.language || 'javascript').toLowerCase();
    const card = document.createElement('article');
    card.className = 'snippet-card';
    card.innerHTML = `
      <div>
        <h4>${escapeHtml(snippet.title)}</h4>
        <div class="snippet-meta">Private - ${language.toUpperCase()} - ${new Date(snippet.createdAt).toLocaleDateString()}</div>
      </div>
      <pre class="language-${language}"><code>${escapeHtml(snippet.code)}</code></pre>
      <div class="snippet-controls">
        <button class="btn secondary copy-snippet" type="button">Copy to Clipboard</button>
      </div>
    `;

    card.querySelector('.copy-snippet').addEventListener('click', async () => {
      await navigator.clipboard.writeText(snippet.code);
      const toast = document.querySelector('#toast');
      toast.textContent = 'Snippet copied';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2400);
    });

    container.appendChild(card);
    if (window.Prism) {
      Prism.highlightElement(card.querySelector('code'));
    }
  });
}

function applySearch(snippets) {
  const searchInput = document.querySelector('#snippet-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = snippets.filter((item) => (
      item.title.toLowerCase().includes(query) || item.code.toLowerCase().includes(query)
    ));
    renderSnippets(filtered);
  });
}

export async function initSnippets(showToast) {
  let snippets = [];
  try {
    snippets = await fetchSnippets();
    renderSnippets(snippets);
    applySearch(snippets);
  } catch (error) {
    showToast(error.message);
  }

  const form = document.querySelector('#snippet-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.querySelector('#snippet-title').value.trim();
    const language = document.querySelector('#snippet-language').value;
    const code = document.querySelector('#snippet-code').value.trim();

    if (!title || !code) {
      showToast('Fill title and code to save a snippet');
      return;
    }

    try {
      const saved = await saveSnippet({ title, language, code });
      snippets = [saved, ...snippets];
      renderSnippets(snippets);
      form.reset();
      showToast('Snippet saved to your private library');
    } catch (error) {
      showToast(error.message);
    }
  });
}
