const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadToR2 } = require('../lib/r2');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/faculty-desk
router.get('/', async (req, res) => {
  try {
    const facultyDesks = await prisma.facultyDesk.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' }
    });
    return res.json({ facultyDesks });
  } catch (error) {
    console.error('[GET /api/faculty-desk]', error);
    return res.status(500).json({ message: 'Error fetching faculty desk entries' });
  }
});

// POST /api/faculty-desk
router.post('/', authenticate, requireRole(['ADMIN', 'FACULTY']), upload.single('photo'), async (req, res) => {
  try {
    const { name, role, designation, branch, foreword, achievements } = req.body;
    let photoUrl = req.body.photoUrl;

    if (req.file) {
      const { url } = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
      photoUrl = url;
    }

    const desk = await prisma.facultyDesk.create({
      data: {
        name,
        role: role || 'NSS_PO',
        designation,
        branch,
        foreword,
        achievements: typeof achievements === 'string' ? JSON.parse(achievements) : (achievements || []),
        photoUrl
      }
    });

    return res.status(201).json({ facultyDesk: desk });
  } catch (error) {
    console.error('[POST /api/faculty-desk]', error);
    return res.status(500).json({ message: 'Error creating faculty desk entry' });
  }
});

module.exports = router;
