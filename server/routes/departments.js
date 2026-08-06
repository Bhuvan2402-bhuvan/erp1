const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/departments
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true, students: true, faculty: true } } }
    });
    return res.json({ departments });
  } catch (error) {
    console.error('[GET /api/departments]', error);
    return res.status(500).json({ message: 'Error fetching departments' });
  }
});

// POST /api/departments
router.post('/', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });

    const dept = await prisma.department.create({
      data: { name, code: code.toUpperCase() }
    });
    return res.status(201).json({ department: dept });
  } catch (error) {
    console.error('[POST /api/departments]', error);
    return res.status(500).json({ message: 'Error creating department' });
  }
});

module.exports = router;
