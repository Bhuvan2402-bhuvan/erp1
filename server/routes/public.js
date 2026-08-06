const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/public/stats
router.get('/stats', async (req, res) => {
  try {
    const [volunteers, events, totalPoints] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', approvalStatus: 'APPROVED' } }),
      prisma.event.count({ where: { status: 'COMPLETED' } }),
      prisma.student.aggregate({ _sum: { points: true } })
    ]);

    return res.json({
      volunteers,
      eventsCompleted: events,
      totalVolunteerHours: (totalPoints._sum.points || 0) * 2,
      impactScore: (volunteers * 10) + (events * 25)
    });
  } catch (error) {
    console.error('[GET /api/public/stats]', error);
    return res.status(500).json({ message: 'Error fetching public stats' });
  }
});

// GET /api/public/messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await prisma.publicMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { author: { select: { name: true, role: true } } }
    });
    return res.json({ messages });
  } catch (error) {
    console.error('[GET /api/public/messages]', error);
    return res.status(500).json({ message: 'Error fetching public messages' });
  }
});

// POST /api/public/messages
router.post('/messages', authenticate, async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { content } = req.body;

    if (!content) return res.status(400).json({ message: 'Content is required' });

    const message = await prisma.publicMessage.create({
      data: {
        authorId: dbUser.id,
        content
      },
      include: { author: { select: { name: true, role: true } } }
    });

    return res.status(201).json({ message });
  } catch (error) {
    console.error('[POST /api/public/messages]', error);
    return res.status(500).json({ message: 'Error posting public message' });
  }
});

module.exports = router;
