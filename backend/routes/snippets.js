const express = require('express');
const db = require('../models/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const snippets = await db.getCollection('snippets');
    const ownedSnippets = snippets
      .filter((snippet) => snippet.ownerId === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(ownedSnippets);
  } catch (error) {
    res.status(500).json({ error: 'Unable to load snippets' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, code, language } = req.body;
    if (!title || !code || !language) {
      return res.status(400).json({ error: 'Title, code, and language are required' });
    }
    const newSnippet = {
      title: String(title).trim(),
      code: String(code),
      language: String(language).trim().toLowerCase(),
      ownerId: req.user.id,
      ownerName: req.user.name || req.user.email,
      createdAt: new Date().toISOString()
    };
    const saved = await db.addItem('snippets', newSnippet);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save snippet' });
  }
});

module.exports = router;
