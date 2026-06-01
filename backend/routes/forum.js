const express = require('express');
const db = require('../models/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function publicPost(post) {
  return {
    ...post,
    comments: post.comments || []
  };
}

router.get('/', async (req, res) => {
  try {
    const posts = await db.getCollection('forum');
    res.json(posts.map(publicPost).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ error: 'Unable to load forum posts' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, buggyCode, language } = req.body;
    if (!title || !buggyCode) {
      return res.status(400).json({ error: 'Title and buggy code are required' });
    }

    const newPost = {
      title: String(title).trim(),
      description: String(description || '').trim(),
      buggyCode: String(buggyCode),
      language: String(language || 'javascript').trim().toLowerCase(),
      authorId: req.user.id,
      authorName: req.user.name || req.user.email,
      comments: [],
      createdAt: new Date().toISOString()
    };

    const saved = await db.addItem('forum', newPost);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save forum post' });
  }
});

async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { message, code, language } = req.body;
    if (!message && !code) {
      return res.status(400).json({ error: 'Add a message or code solution' });
    }

    const existingPosts = await db.getCollection('forum');
    const existing = existingPosts.find((post) => post.id === id);
    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const nextComment = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      authorId: req.user.id,
      authorName: req.user.name || req.user.email,
      message: String(message || '').trim(),
      code: String(code || ''),
      language: String(language || existing.language || 'javascript').trim().toLowerCase(),
      createdAt: new Date().toISOString()
    };

    const updated = await db.updateItem('forum', id, {
      comments: [...(existing.comments || []), nextComment]
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Unable to add comment' });
  }
}

router.post('/:id/comments', verifyToken, addComment);
router.post('/:id/comment', verifyToken, addComment);

module.exports = router;
