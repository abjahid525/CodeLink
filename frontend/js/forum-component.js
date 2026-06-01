import { authHeaders } from './auth-utils.js';

const API_URL = '/api/forum';

function escapeHtml(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchForum() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Unable to load forum posts');
  return response.json();
}

async function saveForumPost(post) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(post)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Unable to publish post');
  return data;
}

async function saveComment(postId, comment) {
  const response = await fetch(`${API_URL}/${postId}/comments`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(comment)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Unable to add solution');
  return data;
}

function renderComment(comment) {
  const language = String(comment.language || 'javascript').toLowerCase();
  const codeBlock = comment.code
    ? `<pre class="language-${language}"><code>${escapeHtml(comment.code)}</code></pre>`
    : '';

  return `
    <div class="snippet-card">
      <div class="comment-meta"><strong>${escapeHtml(comment.authorName)}</strong> - ${new Date(comment.createdAt).toLocaleDateString()}</div>
      ${comment.message ? `<p>${escapeHtml(comment.message)}</p>` : ''}
      ${codeBlock}
    </div>
  `;
}

function renderForum(posts, showToast) {
  const container = document.querySelector('#forum-list');
  container.innerHTML = '';
  if (!posts.length) {
    container.innerHTML = '<p class="forum-card">No bug-fix posts yet. Share your first one.</p>';
    return;
  }

  posts.forEach((post) => {
    const language = String(post.language || 'javascript').toLowerCase();
    const card = document.createElement('article');
    card.className = 'forum-card feed-post';
    card.innerHTML = `
      <div>
        <h4>${escapeHtml(post.title)}</h4>
        <div class="snippet-meta">Posted by ${escapeHtml(post.authorName || 'Community')} on ${new Date(post.createdAt).toLocaleDateString()}</div>
      </div>
      ${post.description ? `<p>${escapeHtml(post.description)}</p>` : ''}
      <pre class="language-${language}"><code>${escapeHtml(post.buggyCode)}</code></pre>
      <div class="comment-meta">${(post.comments || []).length} solution comment(s)</div>
      <div class="comments-list">${(post.comments || []).map(renderComment).join('')}</div>
      <form class="form-stack comment-form">
        <textarea class="comment-message" placeholder="Explain your solution"></textarea>
        <textarea class="comment-code" placeholder="Optional fixed code"></textarea>
        <select class="comment-language">
          <option value="javascript">JavaScript</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
        </select>
        <button class="btn secondary" type="submit">Comment Solution</button>
      </form>
    `;

    card.querySelector('.comment-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = card.querySelector('.comment-message').value.trim();
      const code = card.querySelector('.comment-code').value.trim();
      const commentLanguage = card.querySelector('.comment-language').value;
      if (!message && !code) {
        showToast('Add a message or code solution');
        return;
      }
      try {
        await saveComment(post.id, { message, code, language: commentLanguage });
        const updated = await fetchForum();
        renderForum(updated, showToast);
        showToast('Solution added');
      } catch (error) {
        showToast(error.message);
      }
    });

    container.appendChild(card);
    if (window.Prism) {
      card.querySelectorAll('code').forEach((block) => Prism.highlightElement(block));
    }
  });
}

export async function initForum(showToast) {
  let posts = [];
  try {
    posts = await fetchForum();
    renderForum(posts, showToast);
  } catch (error) {
    showToast(error.message);
  }

  const form = document.querySelector('#forum-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.querySelector('#forum-title').value.trim();
    const description = document.querySelector('#forum-description').value.trim();
    const buggyCode = document.querySelector('#forum-buggy').value.trim();
    const language = document.querySelector('#forum-language').value;

    if (!title || !buggyCode) {
      showToast('Add a title and buggy code to post');
      return;
    }

    try {
      const saved = await saveForumPost({ title, description, buggyCode, language });
      posts = [saved, ...posts];
      renderForum(posts, showToast);
      form.reset();
      showToast('Bug post published');
    } catch (error) {
      showToast(error.message);
    }
  });
}
