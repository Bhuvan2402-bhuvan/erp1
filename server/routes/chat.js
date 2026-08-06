const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/chat
router.get('/', authenticate, async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { receiverId } = req.query;

    if (!receiverId) return res.status(400).json({ message: 'Receiver ID is required' });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: dbUser.id, receiverId },
          { senderId: receiverId, receiverId: dbUser.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    return res.json({ messages });
  } catch (error) {
    console.error('[GET /api/chat]', error);
    return res.status(500).json({ message: 'Error fetching chat messages' });
  }
});

// POST /api/chat
router.post('/', authenticate, async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }

    const message = await prisma.message.create({
      data: {
        senderId: dbUser.id,
        receiverId,
        content
      }
    });

    return res.status(201).json({ message });
  } catch (error) {
    console.error('[POST /api/chat]', error);
    return res.status(500).json({ message: 'Error sending chat message' });
  }
});

module.exports = router;
