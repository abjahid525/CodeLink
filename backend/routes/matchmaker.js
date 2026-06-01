const express = require('express');
const db = require('../models/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const projects = await db.getCollection('projects');
    res.json(projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ error: 'Unable to load projects' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, skills } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const newProject = {
      title: String(title).trim(),
      description: String(description).trim(),
      skills: String(skills || '').trim(),
      ownerId: req.user.id,
      ownerName: req.user.name || req.user.email,
      comments: [],
      members: [],
      createdAt: new Date().toISOString()
    };

    const saved = await db.addItem('projects', newProject);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Unable to save project' });
  }
});

async function addProjectComment(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'A join message is required' });
    }

    const projects = await db.getCollection('projects');
    const project = projects.find((entry) => entry.id === id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const comment = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      authorId: req.user.id,
      authorName: req.user.name || req.user.email,
      message: String(message).trim(),
      selected: false,
      createdAt: new Date().toISOString()
    };

    const updated = await db.updateItem('projects', id, {
      comments: [...(project.comments || []), comment],
      applicants: (project.comments || []).length + 1
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Unable to add project comment' });
  }
}

router.post('/:id/comments', verifyToken, addProjectComment);
router.post('/:id/apply', verifyToken, addProjectComment);

router.post('/:projectId/select/:commentId', verifyToken, async (req, res) => {
  try {
    const { projectId, commentId } = req.params;
    const projects = await db.getCollection('projects');
    const project = projects.find((entry) => entry.id === projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the project owner can select team members' });
    }

    const comments = project.comments || [];
    const targetComment = comments.find((comment) => comment.id === commentId);
    if (!targetComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const members = project.members || [];
    const alreadySelected = members.some((member) => member.userId === targetComment.authorId);
    const updated = await db.updateItem('projects', projectId, {
      comments: comments.map((comment) => (
        comment.id === commentId ? { ...comment, selected: true } : comment
      )),
      members: alreadySelected
        ? members
        : [
            ...members,
            {
              userId: targetComment.authorId,
              name: targetComment.authorName,
              commentId,
              selectedAt: new Date().toISOString()
            }
          ],
      participants: alreadySelected ? members.length : members.length + 1
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Unable to select team member' });
  }
});

module.exports = router;
