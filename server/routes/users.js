const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/users
router.get('/', authenticate, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const { role, approvalStatus, search } = req.query;
    const where = {};

    if (role) where.role = role;
    if (approvalStatus) where.approvalStatus = approvalStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        student: true,
        faculty: true
      }
    });

    return res.json({ users });
  } catch (error) {
    console.error('[GET /api/users]', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        student: { include: { certificates: true, pointsLogs: true, warningLogs: true } },
        faculty: true
      }
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (error) {
    console.error('[GET /api/users/:id]', error);
    return res.status(500).json({ message: 'Error fetching user' });
  }
});

// PATCH /api/users/:id — Update approval status or block
router.patch('/:id', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus, isBlocked, role } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(approvalStatus && { approvalStatus }),
        ...(isBlocked !== undefined && { isBlocked: Boolean(isBlocked) }),
        ...(role && { role })
      }
    });

    return res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('[PATCH /api/users/:id]', error);
    return res.status(500).json({ message: 'Error updating user' });
  }
});

module.exports = router;
