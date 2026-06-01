const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const snippetsRouter = require('./routes/snippets');
const forumRouter = require('./routes/forum');
const matchmakerRouter = require('./routes/matchmaker');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const HTML_DIR = path.join(FRONTEND_DIR, 'html');
const HTML_PAGES = new Set([
  'index.html',
  'dashboard.html',
  'playground.html',
  'snippets.html',
  'forum.html',
  'matchmaker.html',
  'cheatsheet.html',
  'login.html',
  'register.html'
]);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      frameSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      mediaSrc: ["'self'", 'https://storage.googleapis.com'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"]
    }
  }
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || ['http://localhost:4000', 'http://127.0.0.1:4000'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later'
});

app.use(express.json());
app.use(express.static(FRONTEND_DIR));
app.use(limiter);

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/forum', forumRouter);
app.use('/api/projects', matchmakerRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CodeLink API' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(HTML_DIR, 'index.html'));
});

app.get('/:page.html', (req, res, next) => {
  const page = `${req.params.page}.html`;
  if (!HTML_PAGES.has(page)) return next();
  res.sendFile(path.join(HTML_DIR, page));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(HTML_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CodeLink backend running on http://localhost:${PORT}`);
  console.log(`Security: Helmet enabled, Rate limiting active, JWT authentication ready`);
});
