const express = require('express');
const router = express.Router();
const multer = require('multer');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { uploadToR2, deleteFromR2 } = require('../lib/r2');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/events
router.get('/', authenticate, async (req, res) => {
  try {
    const { dbUser } = req.user;
    const { status, type, page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Auto update status of expired events
    await prisma.event.updateMany({
      where: {
        status: { in: ['UPCOMING', 'ONGOING'] },
        date: { lt: new Date() }
      },
      data: { status: 'COMPLETED' }
    });

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limitNum,
        include: {
          _count: { select: { registrations: true, attendances: true, photos: true } },
          ...(dbUser.student ? {
            registrations: { where: { studentId: dbUser.student.id } }
          } : {})
        }
      }),
      prisma.event.count({ where })
    ]);

    const formattedEvents = events.map(e => {
      const isRegistered = e.registrations ? e.registrations.length > 0 : false;
      const { registrations, ...rest } = e;
      return { ...rest, isRegistered };
    });

    return res.json({
      events: formattedEvents,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    console.error('[GET /api/events]', error);
    return res.status(500).json({ message: 'Error fetching events' });
  }
});

// POST /api/events — Create Event
router.post('/', authenticate, async (req, res) => {
  try {
    const { dbUser } = req.user;

    const isCoordinator = dbUser.student?.isCoordinator;
    if (dbUser.role === 'STUDENT' && !isCoordinator) {
      return res.status(403).json({ message: 'Only coordinators can create events' });
    }

    const { title, description, date, endDate, location, type } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and event date are required' });
    }

    const qrCode = req.body.qrCode || `NSS-EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location,
        type: type || 'ACTIVITY',
        qrCode,
        createdById: dbUser.id
      }
    });

    return res.status(201).json({ message: 'Event created', event });
  } catch (error) {
    console.error('[POST /api/events]', error);
    return res.status(500).json({ message: 'Error creating event' });
  }
});

// GET /api/events/gallery — Public / Combined photos gallery
router.get('/gallery', async (req, res) => {
  try {
    const photos = await prisma.eventPhoto.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        event: { select: { title: true, date: true } },
        uploadedBy: { select: { name: true } }
      }
    });
    return res.json({ photos });
  } catch (error) {
    console.error('[GET /api/events/gallery]', error);
    return res.status(500).json({ message: 'Error fetching gallery photos' });
  }
});

// GET /api/events/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: { select: { name: true, email: true } },
        photos: { orderBy: { createdAt: 'desc' } },
        registrations: { include: { student: { include: { user: true, department: true } } } },
        _count: { select: { attendances: true } }
      }
    });

    if (!event) return res.status(404).json({ message: 'Event not found' });
    return res.json({ event });
  } catch (error) {
    console.error('[GET /api/events/:id]', error);
    return res.status(500).json({ message: 'Error fetching event details' });
  }
});

// POST /api/events/:id/register
router.post('/:id/register', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { dbUser } = req.user;

    if (!dbUser.student) {
      return res.status(400).json({ message: 'Only registered students can register for events' });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.status === 'CANCELLED' || event.status === 'COMPLETED') {
      return res.status(400).json({ message: `Cannot register for a ${event.status.toLowerCase()} event` });
    }

    const registration = await prisma.eventRegistration.upsert({
      where: { eventId_studentId: { eventId: id, studentId: dbUser.student.id } },
      create: { eventId: id, studentId: dbUser.student.id, status: 'REGISTERED' },
      update: { status: 'REGISTERED' }
    });

    return res.json({ message: 'Registered successfully', registration });
  } catch (error) {
    console.error('[POST /api/events/:id/register]', error);
    return res.status(500).json({ message: 'Error registering for event' });
  }
});

// POST /api/events/:id/photos — Upload photo using Cloudflare R2
router.post('/:id/photos', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { dbUser } = req.user;
    const { caption } = req.body;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    let photoUrl = req.body.url;

    if (req.file) {
      const { url } = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
      photoUrl = url;
    }

    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo file or photo URL is required' });
    }

    const photo = await prisma.eventPhoto.create({
      data: {
        eventId: id,
        url: photoUrl,
        caption: caption || null,
        uploadedById: dbUser.id
      }
    });

    return res.status(201).json({ message: 'Photo uploaded successfully to Cloudflare R2', photo });
  } catch (error) {
    console.error('[POST /api/events/:id/photos]', error);
    return res.status(500).json({ message: 'Error uploading event photo' });
  }
});

module.exports = router;
