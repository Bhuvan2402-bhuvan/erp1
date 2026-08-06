const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/attendance
router.get('/', authenticate, async (req, res) => {
  try {
    const { eventId, studentId } = req.query;
    const where = {};
    if (eventId) where.eventId = eventId;
    if (studentId) where.studentId = studentId;

    const attendances = await prisma.eventAttendance.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { title: true, date: true } },
        student: { include: { user: { select: { name: true, email: true } }, department: true } },
        markedBy: { select: { name: true, email: true } }
      }
    });

    return res.json({ attendances });
  } catch (error) {
    console.error('[GET /api/attendance]', error);
    return res.status(500).json({ message: 'Error fetching attendance records' });
  }
});

// POST /api/attendance — Mark attendance
router.post('/', authenticate, async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { eventId, studentId, present } = req.body;

    if (!eventId || !studentId) {
      return res.status(400).json({ message: 'Event ID and Student ID are required' });
    }

    const attendance = await prisma.eventAttendance.upsert({
      where: { eventId_studentId: { eventId, studentId } },
      create: {
        eventId,
        studentId,
        present: present !== undefined ? Boolean(present) : true,
        markedById: dbUser.id
      },
      update: {
        present: present !== undefined ? Boolean(present) : true,
        markedById: dbUser.id
      }
    });

    // Auto reward points if present
    if (attendance.present) {
      await prisma.student.update({
        where: { id: studentId },
        data: { points: { increment: 10 } }
      });
    }

    return res.json({ message: 'Attendance marked', attendance });
  } catch (error) {
    console.error('[POST /api/attendance]', error);
    return res.status(500).json({ message: 'Error marking attendance' });
  }
});

module.exports = router;
