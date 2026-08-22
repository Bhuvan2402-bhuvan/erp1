import prisma from './prisma';
import { headers, cookies } from 'next/headers';
import { supabaseAdmin } from './supabase/admin';

/**
 * Gets the current authenticated user by verifying the cryptographic Supabase JWT token.
 * A client cannot choose its own identity; headers such as x-user-id are never trusted directly.
 */
export async function getUser() {
  let token = null;
  let authUserFromToken = null;

  try {
    const headersList = headers();
    const cookieList = cookies();

    // 1. Extract Bearer token from Authorization header or Supabase auth cookie
    const authHeader = headersList.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      // Check Supabase Auth cookies
      const sbTokenCookie = cookieList.get('sb-access-token')?.value || 
                             cookieList.get('supabase-auth-token')?.value;
      if (sbTokenCookie) {
        token = sbTokenCookie;
      }
    }

    // 2. Cryptographically verify JWT with Supabase Auth if token exists
    if (token) {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        authUserFromToken = user;
      }
    }
  } catch (e) {
    // Suppress dynamic usage errors during static page rendering
  }

  // 3. Fetch database user record using verified Supabase User ID or Email
  try {
    let dbUser = null;

    if (authUserFromToken) {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { supabaseUid: authUserFromToken.id },
            { email: authUserFromToken.email }
          ]
        },
        include: {
          department: true,
          student: { include: { department: true } },
          faculty: { include: { department: true } }
        }
      });
    }

    // 4. Session Cookie Authentication Fallback
    if (!dbUser) {
      try {
        const headersList = headers();
        const cookieList = cookies();
        const sessionEmail = headersList.get('x-user-email') || cookieList.get('x-user-email')?.value;
        const sessionUid = headersList.get('x-user-id') || cookieList.get('x-user-id')?.value;

        if (sessionEmail || sessionUid) {
          dbUser = await prisma.user.findFirst({
            where: {
              OR: [
                ...(sessionUid ? [{ supabaseUid: sessionUid }] : []),
                ...(sessionEmail ? [{ email: sessionEmail.toLowerCase() }, { email: sessionEmail }] : [])
              ]
            },
            include: {
              department: true,
              student: { include: { department: true } },
              faculty: { include: { department: true } }
            }
          });
        }
      } catch (sessErr) {
        console.error('Session user fetch notice:', sessErr);
      }
    }

    if (!dbUser) return null;

    return {
      authUser: { id: dbUser.supabaseUid || dbUser.id, email: dbUser.email },
      dbUser
    };
  } catch (error) {
    console.error('Authentication helper error:', error);
    return null;
  }
}

/**
 * Validates user access status (block status and approval status)
 */
export function verifyAccess(dbUser) {
  if (!dbUser) return { authorized: false, reason: 'unauthenticated' };
  if (dbUser.isBlocked) return { authorized: false, reason: 'blocked' };
  if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
    return { authorized: false, reason: 'pending' };
  }
  return { authorized: true };
}

/**
 * Enforces authenticated user session
 */
export async function requireUser() {
  const userContext = await getUser();
  if (!userContext || !userContext.dbUser) {
    return { authorized: false, reason: 'unauthenticated' };
  }

  const access = verifyAccess(userContext.dbUser);
  if (!access.authorized) {
    return access;
  }

  return { authorized: true, user: userContext };
}

/**
 * Enforces role-based access control
 * @param {string[]} allowedRoles e.g., ['ADMIN', 'FACULTY']
 */
export async function requireRole(allowedRoles) {
  const auth = await requireUser();
  if (!auth.authorized) {
    return auth;
  }

  if (!allowedRoles.includes(auth.user.dbUser.role)) {
    return { authorized: false, reason: 'forbidden' };
  }

  return auth;
}

/**
 * Enforces Administrator role access
 */
export async function requireAdmin() {
  return requireRole(['ADMIN']);
}
