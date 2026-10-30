const express = require('express');
const path = require('path');
require('dotenv').config();
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false
});
if (!isDev) app.use(limiter);

// Serve frontend static files (site HTML lives in frontend/html)
const frontendDir = path.join(__dirname, '..', 'frontend', 'html');
app.use(express.static(frontendDir));

// Serve additional static asset folders referenced by the HTML
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'frontend', 'js')));
app.use('/assets', express.static(path.join(__dirname, '..', 'frontend', 'assets')));

// Basic health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// (SPA fallback moved below so API routes take precedence)

// --- Authentication routes (register/login) ---
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const AUTH_ROUTE = '/api/auth';
const JWT_SECRET = process.env.JWT_SECRET || (isDev ? 'local-development-secret' : null);
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production');
}

// Activity logging (writes to backend/data/activity.json by default)
const dataDirectory = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(dataDirectory, { recursive: true });
const activityFile = path.join(dataDirectory, 'activity.json');
function readActivity() {
  try {
    const raw = fs.readFileSync(activityFile, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}
function writeActivity(arr) {
  fs.writeFileSync(activityFile, JSON.stringify(arr, null, 2));
}

// Activity log helper and richer request logger
function logActivity({ userId = null, userName = null, action = '', resourceType = '', resourceId = null, status = 'success', details = '' } = {}) {
  try {
    const activities = readActivity();
    const entry = {
      id: (Date.now()).toString(),
      userId: userId || null,
      userName: userName || null,
      action,
      resourceType,
      resourceId: resourceId || null,
      status,
      details: details || '',
      time: new Date().toISOString()
    };
    activities.unshift(entry);
    writeActivity(activities.slice(0, 10000));
    return entry;
  } catch (e) {
    console.error('logActivity error', e && e.message);
    return null;
  }
}

// Enriched request logger: records request + response status, attempts to extract user from Bearer token
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    try {
      const auth = req.headers.authorization || '';
      let userId = null, userName = null, role = null;
      const m = auth.match(/^Bearer (.+)$/);
      if (m) {
        try {
          const payload = jwt.verify(m[1], JWT_SECRET);
          userId = payload.id;
          userName = payload.name || null;
          role = payload.role || null;
        } catch (e) {
          // ignore invalid token
        }
      }

      const action = (req.method === 'POST' ? 'Create' : req.method === 'PUT' || req.method === 'PATCH' ? 'Update' : req.method === 'DELETE' ? 'Delete' : (req.path.includes('/login') ? 'Login' : (req.path.includes('/logout') ? 'Logout' : 'Read')));
      const resourceType = req.path.split('/')[2] || '';
      const resourceId = req.params && req.params.id ? req.params.id : null;
      const status = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failed';
      const details = `statusCode:${res.statusCode};duration:${Date.now()-start}ms`;
      logActivity({ userId, userName, action, resourceType, resourceId, status, details });
    } catch (e) {
      console.error('request-log finish error', e && e.message);
    }
  });
  next();
});

// Firebase optional setup
let firebaseAdmin = null;
let firebaseDb = null;
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
if (fs.existsSync(serviceAccountPath) && process.env.FIREBASE_DB_URL) {
  try {
    firebaseAdmin = require('firebase-admin');
    const serviceAccount = require(serviceAccountPath);
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DB_URL
    });
    firebaseDb = firebaseAdmin.database();
    console.log('Firebase admin initialized');
  } catch (err) {
    console.error('Failed to initialize Firebase admin:', err.message);
    firebaseAdmin = null;
  }
}

// Local storage fallback
const storageFile = path.join(dataDirectory, 'storage.json');
function readStorage() {
  try {
    const raw = fs.readFileSync(storageFile, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return { users: [] };
  }
}
function writeStorage(data) {
  fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
}

function safeUsers(users = []) {
  return users.map(({ password, passwordHash, ...rest }) => rest);
}

// Helpers to interact with user store (Firebase or local)
async function findUserByEmail(email) {
  if (firebaseDb) {
    const snapshot = await firebaseDb.ref('users').orderByChild('email').equalTo(email).once('value');
    const val = snapshot.val();
    if (!val) return null;
    const key = Object.keys(val)[0];
    return { id: key, ...val[key] };
  }
  const store = readStorage();
  return store.users.find(u => u.email === email) || null;
}

async function saveUserToStore(user) {
  if (firebaseDb) {
    const ref = firebaseDb.ref('users').push();
    await ref.set(user);
    return { id: ref.key, ...user };
  }
  const store = readStorage();
  user.id = (Date.now()).toString();
  store.users = store.users || [];
  store.users.push(user);
  writeStorage(store);
  return user;
}

app.post(`${AUTH_ROUTE}/register`, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = { name, email, password: hashed, role, createdAt: new Date().toISOString() };
    const saved = await saveUserToStore(user);

    const token = jwt.sign({ id: saved.id, email: saved.email, role: saved.role, name: saved.name }, JWT_SECRET, { expiresIn: '7d' });
    const out = { id: saved.id, name: saved.name, email: saved.email, role: saved.role, token };
    logActivity({ userId: saved.id, userName: saved.name, action: 'Create', resourceType: 'user', resourceId: saved.id, status: 'success' });
    res.status(201).json(out);
  } catch (err) {
    console.error('Register error:', err);
    logActivity({ userId: null, userName: null, action: 'Create', resourceType: 'user', resourceId: null, status: 'failed', details: err.message });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post(`${AUTH_ROUTE}/login`, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    logActivity({ userId: user.id, userName: user.name, action: 'Login', resourceType: 'user', resourceId: user.id, status: 'success' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, token });
  } catch (err) {
    console.error('Login error:', err);
    logActivity({ userId: null, userName: null, action: 'Login', resourceType: 'user', resourceId: null, status: 'failed', details: err.message });
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint to record logout activity (token required)
app.post(`${AUTH_ROUTE}/logout`, adminOnly, (req, res) => {
  try {
    logActivity({ userId: req.user.id, userName: req.user.email || req.user.id, action: 'Logout', resourceType: 'user', resourceId: req.user.id, status: 'success' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Admin middleware
function adminOnly(req, res, next) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin routes
app.get('/api/admin/users', adminOnly, async (req, res) => {
  try {
    if (firebaseDb) {
      const snapshot = await firebaseDb.ref('users').once('value');
      const val = snapshot.val() || {};
      const list = Object.keys(val).map(k => ({ id: k, ...val[k] }));
      return res.json(list);
    }
    const store = readStorage();
    res.json(safeUsers(store.users || []));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/logs', adminOnly, (req, res) => {
  const logs = readActivity();
  res.json(logs);
});

app.get('/api/admin/content', adminOnly, (req, res) => {
  try {
    if (firebaseDb) {
      return res.json({
        snippets: [],
        forum: [],
        projects: []
      });
    }
    const store = readStorage();
    res.json({
      snippets: store.snippets || [],
      forum: store.forum || [],
      projects: store.projects || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Activities query endpoint with filters, pagination, sorting
app.get('/api/admin/activities', adminOnly, (req, res) => {
  try {
    const { page = 1, pageSize = 50, user, action, from, to, resourceType, sort = 'time_desc' } = req.query;
    let list = readActivity();
    // filter
    if (user) list = list.filter(a => (a.userId === user || (a.userName && a.userName.toLowerCase().includes(String(user).toLowerCase()))));
    if (action) list = list.filter(a => a.action === action);
    if (resourceType) list = list.filter(a => a.resourceType === resourceType);
    if (from) { const fromT = new Date(from).toISOString(); list = list.filter(a => a.time >= fromT); }
    if (to) { const toT = new Date(to).toISOString(); list = list.filter(a => a.time <= toT); }
    // sort
    if (sort === 'time_asc') list = list.sort((a,b) => a.time.localeCompare(b.time)); else list = list.sort((a,b) => b.time.localeCompare(a.time));
    const total = list.length;
    const p = Math.max(1, parseInt(page));
    const ps = Math.max(1, parseInt(pageSize));
    const start = (p-1)*ps;
    const pageItems = list.slice(start, start+ps);
    res.json({ total, page: p, pageSize: ps, items: pageItems });
  } catch (e) {
    res.status(500).json({ error: 'Failed to query activities' });
  }
});

// Summary endpoint: totals and recent activities
app.get('/api/admin/summary', adminOnly, (req, res) => {
  try {
    const store = readStorage();
    const users = store.users || [];
    const totalUsers = users.length;
    const totalRecords = ((store.snippets || []).length) + ((store.forum || []).length) + ((store.projects || []).length);
    const activities = readActivity();
    const since = new Date(Date.now() - 24*60*60*1000).toISOString();
    const activeUsers = Array.from(new Set(activities.filter(a => a.time >= since && a.userId).map(a => a.userId))).length;
    const recentActivities = activities.slice(0, 20);
    res.json({ totalUsers, totalRecords, activeUsers, recentActivities });
  } catch (e) {
    res.status(500).json({ error: 'Failed to build summary' });
  }
});

// Records per day (aggregation) based on Create actions
app.get('/api/admin/records-per-day', adminOnly, (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const activities = readActivity();
    const cutoff = Date.now() - days*24*60*60*1000;
    const counts = {};
    activities.forEach(a => {
      if (a.action === 'Create' && a.time) {
        const t = new Date(a.time);
        if (t.getTime() < cutoff) return;
        const d = t.toISOString().slice(0,10);
        counts[d] = (counts[d]||0) + 1;
      }
    });
    const out = [];
    for (let i=0;i<days;i++){
      const d = new Date(Date.now() - i*24*60*60*1000).toISOString().slice(0,10);
      out.push({ date: d, count: counts[d]||0 });
    }
    res.json(out.reverse());
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute records per day' });
  }
});

// Fallback to index.html for client-side routing (after API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Create initial admin from env if set and no admin exists
(async function createInitialAdmin() {
  try {
    const initEmail = process.env.INIT_ADMIN_EMAIL;
    const initPass = process.env.INIT_ADMIN_PASSWORD;
    if (!initEmail || !initPass) return;
    const existing = await findUserByEmail(initEmail);
    if (existing) return;
    const hashed = await bcrypt.hash(initPass, 10);
    const user = { name: 'Admin', email: initEmail, password: hashed, role: 'admin', createdAt: new Date().toISOString() };
    await saveUserToStore(user);
    console.log('Initial admin created:', initEmail);
  } catch (e) {
    console.error('Initial admin creation failed:', e.message);
  }
})();

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

module.exports = app;
