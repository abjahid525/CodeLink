async function fetchJson(url, opts={}){
  // Accept either an explicit admin token or fall back to the app's auth token
  const token = localStorage.getItem('adminToken') || (function(){
    const raw = localStorage.getItem('codelink-user');
    if (!raw) return '';
    try { return 'Bearer ' + JSON.parse(raw).token; } catch { return ''; }
  })();
  const headers = opts.headers || {};
  if (token && !headers['Authorization']) headers['Authorization'] = token.replace(/^Bearer\s*/i,'Bearer ');
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function renderUsers(list){
  const tbody = document.querySelector('#users-table tbody');
  tbody.innerHTML = '';
  list.forEach(u=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.id||''}</td><td>${u.name||''}</td><td>${u.email||''}</td><td>${u.role||''}</td><td>${u.createdAt||''}</td>`;
    tbody.appendChild(tr);
  });
}

function renderLogs(list){
  const tbody = document.querySelector('#logs-table tbody');
  tbody.innerHTML = '';
  list.forEach(l=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${l.time}</td><td>${l.method}</td><td>${l.path}</td><td>${l.ip||''}</td>`;
    tbody.appendChild(tr);
  });
}

function renderContentTable(selector, rows, columns) {
  const tbody = document.querySelector(`${selector} tbody`);
  if (!tbody) return;
  tbody.innerHTML = '';
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = columns.map(([label, getter]) => `<td>${getter(row) || ''}</td>`).join('');
    tbody.appendChild(tr);
  });
}

function renderLogins(list){
  const tbody = document.querySelector('#logins-table tbody');
  tbody.innerHTML = '';
  list.forEach(a=>{
    const tr = document.createElement('tr');
    const user = a.userName || a.userId || '';
    const email = (a.details && a.details.email) || '';
    tr.innerHTML = `<td>${a.time}</td><td>${user}</td><td>${email}</td><td>${a.details||''}</td>`;
    tbody.appendChild(tr);
  });
}

async function showEnteredData(){
  try{
    const content = await fetchJson('/api/admin/content');
    renderContentTable('#snippets-table', content.snippets || [], [
      ['Title', (row) => row.title],
      ['Language', (row) => row.language],
      ['Owner', (row) => row.ownerName || row.ownerId],
      ['Created', (row) => row.createdAt]
    ]);
    renderContentTable('#forum-table', content.forum || [], [
      ['Title', (row) => row.title],
      ['Language', (row) => row.language],
      ['Author', (row) => row.authorName || row.authorId],
      ['Created', (row) => row.createdAt]
    ]);
    renderContentTable('#projects-table', content.projects || [], [
      ['Title', (row) => row.title],
      ['Skills', (row) => row.skills],
      ['Owner', (row) => row.ownerName || row.ownerId],
      ['Created', (row) => row.createdAt]
    ]);
    // scroll into view
    document.querySelector('#admin-views').scrollIntoView({ behavior: 'smooth' });
  }catch(err){
    console.error('Failed to fetch entered data',err);
    alert('Failed to fetch entered data');
  }
}

async function showRecentLogins(){
  try{
    const r = await fetchJson('/api/admin/activities?action=Login&pageSize=100');
    // r may be { total, page, pageSize, items } or an array
    const items = Array.isArray(r) ? r : (r.items || []);
    renderLogins(items);
    document.querySelector('#admin-views').scrollIntoView({ behavior: 'smooth' });
  }catch(err){
    console.error('Failed to fetch recent logins',err);
    alert('Failed to fetch recent logins');
  }
}

async function loadAll(){
  try{
    const users = await fetchJson('/api/admin/users');
    renderUsers(users);
  }catch(e){
    console.error('Failed to load users',e);
    alert('Failed to load users. Ensure you are authorized and have set an admin token in localStorage as `adminToken`.');
  }
  try{
    const logs = await fetchJson('/api/admin/logs');
    renderLogs(logs);
  }catch(e){
    console.error('Failed to load logs',e);
  }

  try {
    const content = await fetchJson('/api/admin/content');
    renderContentTable('#snippets-table', content.snippets || [], [
      ['Title', (row) => row.title],
      ['Language', (row) => row.language],
      ['Owner', (row) => row.ownerName || row.ownerId],
      ['Created', (row) => row.createdAt]
    ]);
    renderContentTable('#forum-table', content.forum || [], [
      ['Title', (row) => row.title],
      ['Language', (row) => row.language],
      ['Author', (row) => row.authorName || row.authorId],
      ['Created', (row) => row.createdAt]
    ]);
    renderContentTable('#projects-table', content.projects || [], [
      ['Title', (row) => row.title],
      ['Skills', (row) => row.skills],
      ['Owner', (row) => row.ownerName || row.ownerId],
      ['Created', (row) => row.createdAt]
    ]);
  } catch (e) {
    console.error('Failed to load content', e);
  }

  // load summary
  try{
    const s = await fetchJson('/api/admin/summary');
    document.getElementById('summary-users').textContent = s.totalUsers;
    document.getElementById('summary-records').textContent = s.totalRecords;
    document.getElementById('summary-active').textContent = s.activeUsers;
    const recentEl = document.getElementById('summary-recent');
    recentEl.innerHTML = s.recentActivities.slice(0,8).map(a=>`${a.time} — ${a.userName||a.userId||'anon'} — ${a.action} ${a.resourceType||''}`).join('<br>');
  }catch(err){
    console.error('Failed to load summary',err);
  }
}

window.addEventListener('DOMContentLoaded', loadAll);
document.addEventListener('DOMContentLoaded', ()=>{
  const btnData = document.getElementById('btn-show-data');
  if (btnData) btnData.addEventListener('click', showEnteredData);
  const btnLogins = document.getElementById('btn-show-logins');
  if (btnLogins) btnLogins.addEventListener('click', showRecentLogins);
});
