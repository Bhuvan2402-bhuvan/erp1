const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/admin/approvals — Pending users list
router.get('/approvals', authenticate, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { approvalStatus: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        student: true,
        faculty: true
      }
    });

    return res.json({ pendingUsers });
  } catch (error) {
    console.error('[GET /api/admin/approvals]', error);
    return res.status(500).json({ message: 'Error fetching pending approvals' });
  }
});

// POST /api/admin/approvals — Action pending user (APPROVE / REJECT)
router.post('/approvals', authenticate, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const { userId, action } = req.body; // action: "APPROVE" | "REJECT"

    if (!userId || !['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ message: 'User ID and valid action (APPROVE/REJECT) are required' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        approvalStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
      }
    });

    return res.json({ message: `User ${action.toLowerCase()}d successfully`, user: updated });
  } catch (error) {
    console.error('[POST /api/admin/approvals]', error);
    return res.status(500).json({ message: 'Error processing approval' });
  }
});

// GET /api/admin/stats — System admin metrics
router.get('/stats', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const [totalUsers, pendingUsers, totalEvents, openIssues] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { approvalStatus: 'PENDING' } }),
      prisma.event.count(),
      prisma.issue.count({ where: { status: 'OPEN' } })
    ]);

    return res.json({
      totalUsers,
      pendingUsers,
      totalEvents,
      openIssues
    });
  } catch (error) {
    console.error('[GET /api/admin/stats]', error);
    return res.status(500).json({ message: 'Error fetching admin stats' });
  }
});

module.exports = router;
