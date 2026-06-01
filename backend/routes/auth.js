const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { JWT_SECRET, verifyToken } = require('../middleware/auth');

const router = express.Router();
const ALLOWED_ROLES = ['student', 'teacher', 'admin'];
const JWT_EXPIRY = '7d';

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePassword(password, hash) {
  if (String(hash).startsWith('$2')) {
    return bcrypt.compare(password, hash);
  }
  // Older seed accounts used SHA-256; keep them usable while new accounts use bcrypt.
  const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
  return legacyHash === hash;
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password and role are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({ error: `Role must be one of: ${ALLOWED_ROLES.join(', ')}` });
  }

  try {
    const users = await db.getCollection('users');
    const existing = users.find((user) => user.email === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }

    const passwordHash = await hashPassword(String(password));
    const newUser = await db.addItem('users', {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      createdAt: new Date().toISOString()
    });

    const token = generateToken(newUser);
    res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const users = await db.getCollection('users');
    const existing = users.find((user) => user.email === normalizedEmail);

    if (!existing) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    const isPasswordValid = await comparePassword(String(password), existing.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }

    const token = generateToken(existing);
    res.json({
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role,
      token,
      createdAt: existing.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

module.exports = router;
module.exports.verifyToken = verifyToken;
