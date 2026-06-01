const fs = require('fs').promises;
const path = require('path');

const STORAGE_PATH = path.join(__dirname, '..', 'data', 'storage.json');
let state = null;

async function loadState() {
  if (state) return;
  try {
    const raw = await fs.readFile(STORAGE_PATH, 'utf8');
    state = JSON.parse(raw);
  } catch (error) {
    state = {
      snippets: [],
      forum: [],
      projects: [],
      users: []
    };
    await saveState();
  }
}

async function saveState() {
  await fs.writeFile(STORAGE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function buildItem(item) {
  return {
    ...item,
    id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  };
}

async function getCollection(name) {
  await loadState();
  return state[name] || [];
}

async function addItem(name, item) {
  await loadState();
  const wrapped = buildItem(item);
  if (!state[name]) state[name] = [];
  state[name].push(wrapped);
  await saveState();
  return wrapped;
}

async function updateItem(name, id, changes) {
  await loadState();
  const list = state[name] || [];
  const index = list.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  state[name][index] = { ...state[name][index], ...changes };
  await saveState();
  return state[name][index];
}

async function incrementProject(id, field) {
  await loadState();
  const list = state.projects || [];
  const index = list.findIndex((entry) => entry.id === id);
  if (index === -1) return null;
  if (!['participants', 'applicants'].includes(field)) return null;
  state.projects[index][field] = (state.projects[index][field] || 0) + 1;
  await saveState();
  return state.projects[index];
}

module.exports = {
  getCollection,
  addItem,
  updateItem,
  incrementProject
};
