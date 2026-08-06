const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' }
    });
    return res.json({ testimonials });
  } catch (error) {
    console.error('[GET /api/testimonials]', error);
    return res.status(500).json({ message: 'Error fetching testimonials' });
  }
});

// POST /api/testimonials
router.post('/', authenticate, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const { name, role, dept, quote, avatar } = req.body;

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        dept,
        quote,
        avatar: avatar || name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
      }
    });

    return res.status(201).json({ testimonial });
  } catch (error) {
    console.error('[POST /api/testimonials]', error);
    return res.status(500).json({ message: 'Error creating testimonial' });
  }
});

module.exports = router;
