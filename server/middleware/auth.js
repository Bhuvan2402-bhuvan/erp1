const prisma = require('../lib/prisma');

async function authenticate(req, res, next) {
  try {
    const headerUserId = req.headers['x-user-id'] || req.cookies?.['x-user-id'];
    const headerUserEmail = req.headers['x-user-email'] || req.cookies?.['x-user-email'];

    if (!headerUserId && !headerUserEmail) {
      return res.status(401).json({ message: 'Unauthorized: Missing authentication headers' });
    }

    let dbUser = null;

    if (headerUserEmail) {
      dbUser = await prisma.user.findUnique({
        where: { email: headerUserEmail },
        include: {
          department: true,
          student: { include: { department: true } },
          faculty: { include: { department: true } }
        }
      });
    }

    if (!dbUser && headerUserId) {
      dbUser = await prisma.user.findUnique({
        where: { supabaseUid: headerUserId },
        include: {
          department: true,
          student: { include: { department: true } },
          faculty: { include: { department: true } }
        }
      });
    }

    // Demo user fallback
    if (!dbUser && headerUserEmail) {
      const demoEmails = ['admin1@erp.com', 'admin2@erp.com', 'faculty1@erp.com', 'faculty2@erp.com', 'coord1@erp.com', 'volunteer1@erp.com'];
      if (demoEmails.includes(headerUserEmail.toLowerCase())) {
        const isFaculty = headerUserEmail.includes('faculty');
        const isAdmin = headerUserEmail.includes('admin');
        const isCoord = headerUserEmail.includes('coord');
        const role = req.headers['x-user-role'] || (isAdmin ? 'ADMIN' : isFaculty ? 'FACULTY' : 'STUDENT');
        const uid = headerUserId || 'fallback-uid-' + Math.random().toString(36).substring(2, 8);

        dbUser = {
          id: uid,
          supabaseUid: uid,
          email: headerUserEmail,
          name: headerUserEmail.split('@')[0].toUpperCase(),
          role,
          approvalStatus: 'APPROVED',
          isBlocked: false,
          department: { id: 'fallback-dept', name: 'Computer Science & Engineering', code: 'CSE' },
          faculty: isFaculty ? { id: 'fallback-fac', employeeId: 'FAC1001', designation: 'Faculty Coordinator' } : null,
          student: (!isAdmin && !isFaculty) ? { id: 'fallback-stu', rollNo: '21CSE101', year: 3, section: 'A', semester: 6, isCoordinator: isCoord } : null
        };
      }
    }

    if (!dbUser) {
      return res.status(401).json({ message: 'Unauthorized: User account not found' });
    }

    if (dbUser.isBlocked) {
      return res.status(403).json({ message: 'Forbidden: Account is blocked' });
    }

    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Account pending approval' });
    }

    req.user = {
      authUser: { id: dbUser.supabaseUid, email: dbUser.email },
      dbUser
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]', error);
    return res.status(500).json({ message: 'Internal server authentication error' });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.dbUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { role } = req.user.dbUser;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role permissions' });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
