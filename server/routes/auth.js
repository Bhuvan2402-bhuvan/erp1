const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    return res.json({ user: req.user.dbUser });
  } catch (error) {
    console.error('[Auth me]', error);
    return res.status(500).json({ message: 'Error fetching current user' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, name, role, departmentId, rollNo, year, section, semester, employeeId, designation } = req.body;

    if (!email || !name) {
      return res.status(400).json({ message: 'Email and name are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const supabaseUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const user = await prisma.user.create({
      data: {
        supabaseUid,
        email,
        name,
        role: role || 'STUDENT',
        departmentId: departmentId || null,
        approvalStatus: role === 'ADMIN' ? 'APPROVED' : 'PENDING',
        ...(role === 'STUDENT' && rollNo ? {
          student: {
            create: {
              rollNo,
              year: parseInt(year || '1'),
              section: section || 'A',
              semester: parseInt(semester || '1'),
              departmentId: departmentId || 'default-dept-id'
            }
          }
        } : {}),
        ...(role === 'FACULTY' && employeeId ? {
          faculty: {
            create: {
              employeeId,
              designation: designation || 'Faculty Coordinator',
              departmentId: departmentId || 'default-dept-id'
            }
          }
        } : {})
      },
      include: {
        department: true,
        student: true,
        faculty: true
      }
    });

    return res.status(201).json({ message: 'Account created successfully', user });
  } catch (error) {
    console.error('[Auth signup]', error);
    return res.status(500).json({ message: 'Error creating account' });
  }
});

// POST /api/auth/onboarding
router.post('/onboarding', authenticate, async (req, res) => {
  try {
    const { name, phone, bio, rollNo, year, section, semester, departmentId, employeeId, designation } = req.body;
    const { dbUser } = req.user;

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        name: name || dbUser.name,
        phone: phone || dbUser.phone,
        bio: bio || dbUser.bio,
        departmentId: departmentId || dbUser.departmentId,
      },
      include: { department: true, student: true, faculty: true }
    });

    if (dbUser.role === 'STUDENT' && rollNo) {
      await prisma.student.upsert({
        where: { userId: dbUser.id },
        create: {
          userId: dbUser.id,
          rollNo,
          year: parseInt(year || '1'),
          section: section || 'A',
          semester: parseInt(semester || '1'),
          departmentId: departmentId || dbUser.departmentId
        },
        update: {
          rollNo,
          year: parseInt(year || '1'),
          section: section || 'A',
          semester: parseInt(semester || '1'),
          departmentId: departmentId || dbUser.departmentId
        }
      });
    }

    return res.json({ message: 'Onboarding completed', user: updatedUser });
  } catch (error) {
    console.error('[Auth onboarding]', error);
    return res.status(500).json({ message: 'Error during onboarding' });
  }
});

module.exports = router;
