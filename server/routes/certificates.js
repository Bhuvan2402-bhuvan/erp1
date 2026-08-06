const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadToR2 } = require('../lib/r2');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

// GET /api/certificates
router.get('/', authenticate, async (req, res) => {
  try {
    const { dbUser } = req.user;

    const where = {};
    if (dbUser.role === 'STUDENT') {
      if (!dbUser.student) return res.json({ certificates: [] });
      where.studentId = dbUser.student.id;
    }

    const certificates = await prisma.certificate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { name: true, email: true } } } }
      }
    });

    return res.json({ certificates });
  } catch (error) {
    console.error('[GET /api/certificates]', error);
    return res.status(500).json({ message: 'Error fetching certificates' });
  }
});

// POST /api/certificates — Issue / Upload Certificate (Admin & Faculty)
router.post('/', authenticate, requireRole(['ADMIN', 'FACULTY']), upload.single('file'), async (req, res) => {
  try {
    const { studentId, title, description } = req.body;
    let fileUrl = req.body.fileUrl;

    if (!studentId || !title) {
      return res.status(400).json({ message: 'Student ID and title are required' });
    }

    if (req.file) {
      const { url } = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
      fileUrl = url;
    }

    if (!fileUrl) {
      return res.status(400).json({ message: 'Certificate PDF file or URL is required' });
    }

    const certificate = await prisma.certificate.create({
      data: {
        studentId,
        title,
        description,
        fileUrl
      }
    });

    return res.status(201).json({ message: 'Certificate issued successfully', certificate });
  } catch (error) {
    console.error('[POST /api/certificates]', error);
    return res.status(500).json({ message: 'Error issuing certificate' });
  }
});

module.exports = router;
