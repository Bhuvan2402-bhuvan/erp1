const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadToR2 } = require('../lib/r2');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/warnings — Issue warning log
router.post('/', authenticate, requireRole(['ADMIN', 'FACULTY']), upload.single('proof'), async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { studentId, reason } = req.body;
    let proofUrl = req.body.proofUrl;

    if (!studentId || !reason) {
      return res.status(400).json({ message: 'Student ID and reason are required' });
    }

    if (req.file) {
      const { url } = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
      proofUrl = url;
    }

    const [log, student] = await Promise.all([
      prisma.warningLog.create({
        data: {
          studentId,
          issuedById: dbUser.id,
          reason,
          proofUrl
        }
      }),
      prisma.student.update({
        where: { id: studentId },
        data: { warnings: { increment: 1 } }
      })
    ]);

    return res.status(201).json({ message: 'Warning issued', log, totalWarnings: student.warnings });
  } catch (error) {
    console.error('[POST /api/warnings]', error);
    return res.status(500).json({ message: 'Error issuing warning' });
  }
});

module.exports = router;
