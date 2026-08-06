const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/campaign-widget
router.get('/', async (req, res) => {
  try {
    const widget = await prisma.campaignWidget.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });
    return res.json({ widget });
  } catch (error) {
    console.error('[GET /api/campaign-widget]', error);
    return res.status(500).json({ message: 'Error fetching campaign widget' });
  }
});

// POST /api/campaign-widget
router.post('/', authenticate, requireRole(['ADMIN', 'FACULTY']), async (req, res) => {
  try {
    const { campaignName, currentCount, targetCount, activities, isActive } = req.body;

    const widget = await prisma.campaignWidget.create({
      data: {
        campaignName,
        currentCount: parseInt(currentCount || '0'),
        targetCount: parseInt(targetCount || '100'),
        activities: activities || [],
        isActive: isActive !== undefined ? Boolean(isActive) : true
      }
    });

    return res.status(201).json({ widget });
  } catch (error) {
    console.error('[POST /api/campaign-widget]', error);
    return res.status(500).json({ message: 'Error updating campaign widget' });
  }
});

module.exports = router;
