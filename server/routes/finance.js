const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');
const { uploadToR2 } = require('../lib/r2');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/finance
router.get('/', authenticate, async (req, res) => {
  try {
    const records = await prisma.financeRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true, email: true } },
        department: { select: { name: true, code: true } }
      }
    });

    const summary = records.reduce((acc, r) => {
      if (r.type === 'INCOME') acc.totalIncome += r.amount;
      if (r.type === 'EXPENSE') acc.totalExpense += r.amount;
      if (r.type === 'BUDGET') acc.totalBudget += r.amount;
      return acc;
    }, { totalIncome: 0, totalExpense: 0, totalBudget: 0 });

    return res.json({ records, summary });
  } catch (error) {
    console.error('[GET /api/finance]', error);
    return res.status(500).json({ message: 'Error fetching finance records' });
  }
});

// POST /api/finance — Create finance record
router.post('/', authenticate, requireRole(['ADMIN', 'FACULTY']), upload.single('receipt'), async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { title, amount, type, category, description, departmentId } = req.body;
    let receiptUrl = req.body.receiptUrl;

    if (!title || !amount) {
      return res.status(400).json({ message: 'Title and amount are required' });
    }

    if (req.file) {
      const { url } = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
      receiptUrl = url;
    }

    const record = await prisma.financeRecord.create({
      data: {
        title,
        amount: parseFloat(amount),
        type: type || 'EXPENSE',
        category: category || 'GENERAL',
        description,
        receiptUrl,
        departmentId: departmentId || dbUser.departmentId || null,
        createdById: dbUser.id
      }
    });

    return res.status(201).json({ message: 'Finance record logged', record });
  } catch (error) {
    console.error('[POST /api/finance]', error);
    return res.status(500).json({ message: 'Error creating finance record' });
  }
});

module.exports = router;
