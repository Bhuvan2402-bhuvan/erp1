const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/issues
router.get('/', authenticate, async (req, res) => {
  try {
    const { dbUser } = req.user;
    const where = {};

    if (dbUser.role === 'STUDENT') {
      if (!dbUser.student) return res.json({ issues: [] });
      where.studentId = dbUser.student.id;
    }

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { name: true, email: true } }, department: true } },
        resolvedBy: { select: { name: true, email: true } }
      }
    });

    return res.json({ issues });
  } catch (error) {
    console.error('[GET /api/issues]', error);
    return res.status(500).json({ message: 'Error fetching issues' });
  }
});

// POST /api/issues — Report issue
router.post('/', authenticate, async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { title, description } = req.body;

    if (!dbUser.student) {
      return res.status(400).json({ message: 'Only students can report issues' });
    }

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const issue = await prisma.issue.create({
      data: {
        studentId: dbUser.student.id,
        title,
        description,
        status: 'OPEN'
      }
    });

    return res.status(201).json({ message: 'Issue submitted successfully', issue });
  } catch (error) {
    console.error('[POST /api/issues]', error);
    return res.status(500).json({ message: 'Error creating issue' });
  }
});

// PATCH /api/issues/:id — Update issue status (Admin / Faculty)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { dbUser } = req.user;
    const { status } = req.body;

    if (dbUser.role === 'STUDENT') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        status,
        ...(status === 'RESOLVED' ? { resolvedById: dbUser.id, resolvedAt: new Date() } : {})
      }
    });

    return res.json({ message: 'Issue status updated', issue });
  } catch (error) {
    console.error('[PATCH /api/issues/:id]', error);
    return res.status(500).json({ message: 'Error updating issue status' });
  }
});

module.exports = router;
