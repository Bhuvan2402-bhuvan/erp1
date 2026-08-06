/**
 * Express Auth Middleware — NSS ERP (Render Backend)
 *
 * Auth order:
 *  1. Supabase JWT  — Authorization: Bearer <access_token>
 *     Verified with SUPABASE_JWT_SECRET (HS256) or fetched JWKS (RS256).
 *  2. Legacy headers — x-user-id / x-user-email (set by Next.js middleware)
 *     Maintained for backward compatibility with existing frontend flows.
 */

'use strict';

const jwt       = require('jsonwebtoken');
const prisma    = require('../lib/prisma');

// ─── JWT verification ────────────────────────────────────────────────────────

/**
 * Attempt to verify a Supabase-issued JWT.
 * Supports HS256 (SUPABASE_JWT_SECRET env var).
 * Returns the decoded payload or null on failure.
 *
 * @param {string} token  Raw JWT string (without "Bearer " prefix)
 * @returns {object|null}
 */
function verifySupabaseJwt(token) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  try {
    // Supabase JWTs are HS256-signed by default.
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256', 'RS256'] });
    return decoded;
  } catch (err) {
    // Token invalid / expired — do NOT fall through silently with a bad token
    if (err.name !== 'JsonWebTokenError' && err.name !== 'TokenExpiredError') {
      console.error('[Auth] JWT verification error:', err.message);
    }
    return null;
  }
}

// ─── DB hydration ─────────────────────────────────────────────────────────────

/**
 * Load the full Prisma user record plus relations.
 * Tries email lookup first, then supabaseUid.
 *
 * @param {object} opts  { email?, supabaseUid? }
 * @returns {Promise<object|null>}
 */
async function hydrateUser({ email, supabaseUid } = {}) {
  const include = {
    department: true,
    student: { include: { department: true } },
    faculty:  { include: { department: true } },
  };

  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, include });
    if (user) return user;
  }

  if (supabaseUid) {
    const user = await prisma.user.findUnique({ where: { supabaseUid }, include });
    if (user) return user;
  }

  return null;
}

// ─── Main authenticate middleware ─────────────────────────────────────────────

/**
 * Middleware: authenticate
 *
 * Attaches `req.user = { authUser, dbUser }` on success.
 * Returns 401 / 403 on failure.
 */
async function authenticate(req, res, next) {
  try {
    let dbUser  = null;
    let authPayload = null;

    // ── Path 1: Supabase JWT Bearer token ──────────────────────────────────
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      const token   = authHeader.slice(7).trim();
      const decoded = verifySupabaseJwt(token);

      if (decoded) {
        authPayload = decoded;
        // JWT sub is the Supabase user UUID; email may live at top level or in user_metadata
        const email      = decoded.email || decoded.user_metadata?.email;
        const supabaseUid = decoded.sub;
        dbUser = await hydrateUser({ email, supabaseUid });
      } else if (authHeader) {
        // A Bearer token was supplied but failed verification — reject immediately
        // (don't silently fall through to legacy path with a bad token)
        return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
      }
    }

    // ── Path 2: Legacy header fallback (x-user-id / x-user-email) ──────────
    if (!dbUser) {
      const headerUserId    = req.headers['x-user-id'];
      const headerUserEmail = req.headers['x-user-email'];

      if (!headerUserId && !headerUserEmail) {
        return res.status(401).json({ message: 'Unauthorized: No authentication credentials provided' });
      }

      dbUser = await hydrateUser({ email: headerUserEmail, supabaseUid: headerUserId });

      // Demo user fallback — keeps presentation accounts working
      if (!dbUser && headerUserEmail) {
        const demoEmails = [
          'admin1@erp.com', 'admin2@erp.com',
          'faculty1@erp.com', 'faculty2@erp.com',
          'coord1@erp.com', 'volunteer1@erp.com',
        ];
        if (demoEmails.includes(headerUserEmail.toLowerCase())) {
          const isFaculty = headerUserEmail.includes('faculty');
          const isAdmin   = headerUserEmail.includes('admin');
          const isCoord   = headerUserEmail.includes('coord');
          const role      = req.headers['x-user-role'] || (isAdmin ? 'ADMIN' : isFaculty ? 'FACULTY' : 'STUDENT');
          const uid       = headerUserId || `demo-uid-${Math.random().toString(36).slice(2, 8)}`;

          dbUser = {
            id: uid, supabaseUid: uid, email: headerUserEmail,
            name: headerUserEmail.split('@')[0].toUpperCase(),
            role, approvalStatus: 'APPROVED', isBlocked: false,
            department: { id: 'demo-dept', name: 'Computer Science & Engineering', code: 'CSE' },
            faculty: isFaculty ? { id: 'demo-fac', employeeId: 'FAC1001', designation: 'Faculty Coordinator' } : null,
            student: (!isAdmin && !isFaculty)
              ? { id: 'demo-stu', rollNo: '21CSE101', year: 3, section: 'A', semester: 6, isCoordinator: isCoord }
              : null,
          };
        }
      }
    }

    // ── Authorization checks ────────────────────────────────────────────────
    if (!dbUser) {
      return res.status(401).json({ message: 'Unauthorized: User account not found' });
    }

    if (dbUser.isBlocked) {
      return res.status(403).json({ message: 'Forbidden: Account is blocked' });
    }

    if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: Account pending approval' });
    }

    // ── Hydrate req.user ────────────────────────────────────────────────────
    req.user = {
      // JWT-sourced fields (null if legacy path)
      id:    authPayload?.sub    || dbUser.supabaseUid,
      email: authPayload?.email  || dbUser.email,
      role:  authPayload?.role   || dbUser.role,
      // Full Prisma record
      authUser: { id: dbUser.supabaseUid, email: dbUser.email },
      dbUser,
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware]', error);
    return res.status(500).json({ message: 'Internal server authentication error' });
  }
}

// ─── Role guard factory ───────────────────────────────────────────────────────

/**
 * Middleware factory: requireRole
 *
 * Usage: router.post('/admin-only', authenticate, requireRole(['ADMIN']), handler)
 *
 * @param {string[]} allowedRoles
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user?.dbUser) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.dbUser.role)) {
      return res.status(403).json({
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
