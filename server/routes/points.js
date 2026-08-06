const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /api/points — Award points to student
router.post('/', authenticate, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { studentId, points, reason } = req.body;

    if (!studentId || !points || !reason) {
      return res.status(400).json({ message: 'Student ID, points amount, and reason are required' });
    }

    const pointsNum = parseInt(points);

    const [log, student] = await Promise.all([
      prisma.pointsLog.create({
        data: {
          studentId,
          awardedById: dbUser.id,
          points: pointsNum,
          reason
        }
      }),
      prisma.student.update({
        where: { id: studentId },
        data: { points: { increment: pointsNum } }
      })
    ]);

    return res.status(201).json({ message: 'Points awarded', log, updatedPoints: student.points });
  } catch (error) {
    console.error('[POST /api/points]', error);
    return res.status(500).json({ message: 'Error awarding points' });
  }
});

module.exports = router;
