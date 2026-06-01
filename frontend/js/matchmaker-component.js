import { authHeaders, getStoredUser } from './auth-utils.js';

const API_URL = '/api/projects';

function escapeHtml(text) {
  return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchProjects() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error('Unable to load projects');
  return response.json();
}

async function saveProject(project) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(project)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Unable to post project');
  return data;
}

async function addJoinComment(projectId, message) {
  const response = await fetch(`${API_URL}/${projectId}/comments`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ message })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Unable to comment');
  return data;
}

async function selectMember(projectId, commentId) {
  const response = await fetch(`${API_URL}/${projectId}/select/${commentId}`, {
    method: 'POST',
    headers: authHeaders()
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Unable to select member');
  return data;
}

function renderProjects(projects, showToast) {
  const currentUser = getStoredUser();
  const container = document.querySelector('#project-list');
  container.innerHTML = '';

  if (!projects.length) {
    container.innerHTML = '<p class="project-card">No requests yet. Invite others with your next project.</p>';
    return;
  }

  projects.forEach((project) => {
    const comments = project.comments || [];
    const members = project.members || [];
    const isOwner = currentUser?.id && currentUser.id === project.ownerId;
    const card = document.createElement('article');
    card.className = 'project-card';
    card.innerHTML = `
      <div>
        <h4>${escapeHtml(project.title)}</h4>
        <div class="snippet-meta">Posted by ${escapeHtml(project.ownerName || 'Community')} on ${new Date(project.createdAt).toLocaleDateString()}</div>
      </div>
      <p>${escapeHtml(project.description)}</p>
      <div class="project-meta">Skills: ${escapeHtml(project.skills || 'Open to all')}</div>
      <div class="project-meta">Selected members: ${members.length}</div>
      <div class="comments-list">
        ${comments.map((comment) => `
          <div class="snippet-card">
            <div class="comment-meta"><strong>${escapeHtml(comment.authorName)}</strong> - ${new Date(comment.createdAt).toLocaleDateString()}</div>
            <p>${escapeHtml(comment.message)}</p>
            ${comment.selected ? '<span class="status-pill">Selected</span>' : ''}
            ${isOwner && !comment.selected ? `<button class="btn secondary select-member" type="button" data-comment-id="${comment.id}">Select Member</button>` : ''}
          </div>
        `).join('')}
      </div>
      <form class="form-stack join-form">
        <textarea class="join-message" placeholder="Say why you want to join this team"></textarea>
        <button class="btn secondary" type="submit">I Want to Join</button>
      </form>
    `;

    card.querySelector('.join-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = card.querySelector('.join-message').value.trim();
      if (!message) {
        showToast('Write a short join message');
        return;
      }
      try {
        await addJoinComment(project.id, message);
        renderProjects(await fetchProjects(), showToast);
        showToast('Join request posted');
      } catch (error) {
        showToast(error.message);
      }
    });

    card.querySelectorAll('.select-member').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await selectMember(project.id, button.dataset.commentId);
          renderProjects(await fetchProjects(), showToast);
          showToast('Team member selected');
        } catch (error) {
          showToast(error.message);
        }
      });
    });

    container.appendChild(card);
  });
}

export async function initMatchmaker(showToast) {
  let projects = [];
  try {
    projects = await fetchProjects();
    renderProjects(projects, showToast);
  } catch (error) {
    showToast(error.message);
  }

  const form = document.querySelector('#project-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = document.querySelector('#project-title').value.trim();
    const description = document.querySelector('#project-description').value.trim();
    const skills = document.querySelector('#project-skills').value.trim();

    if (!title || !description) {
      showToast('Add title and description to post a request');
      return;
    }

    try {
      const saved = await saveProject({ title, description, skills });
      projects = [saved, ...projects];
      renderProjects(projects, showToast);
      form.reset();
      showToast('Collaboration request posted');
    } catch (error) {
      showToast(error.message);
    }
  });
}
