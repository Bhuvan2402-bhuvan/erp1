const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { uploadToR2 } = require('../lib/r2');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// GET /api/documentation
router.get('/', authenticate, async (req, res) => {
  try {
    const { category } = req.query;
    const where = category ? { category } : {};

    const docs = await prisma.documentation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { name: true, role: true } }
      }
    });

    return res.json({ documentations: docs });
  } catch (error) {
    console.error('[GET /api/documentation]', error);
    return res.status(500).json({ message: 'Error fetching documentations' });
  }
});

// POST /api/documentation — Upload documentation file to Cloudflare R2
router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { title, category, description } = req.body;
    let fileUrl = req.body.fileUrl;

    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required' });
    }

    if (req.file) {
      const { url } = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
      fileUrl = url;
    }

    if (!fileUrl) {
      return res.status(400).json({ message: 'Documentation file or URL is required' });
    }

    const doc = await prisma.documentation.create({
      data: {
        title,
        category,
        description,
        fileUrl,
        uploadedById: dbUser.id
      }
    });

    return res.status(201).json({ message: 'Documentation uploaded to Cloudflare R2', documentation: doc });
  } catch (error) {
    console.error('[POST /api/documentation]', error);
    return res.status(500).json({ message: 'Error uploading documentation' });
  }
});

module.exports = router;
