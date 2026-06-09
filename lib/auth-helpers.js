import { createClient } from './supabase/server';
import prisma from './prisma';
import { headers } from 'next/headers';

/**
 * Gets the current authenticated user along with their Prisma database record (which contains role/approval status)
 */
export async function getUser() {
  // 1. Try to read from headers set by middleware to bypass slow Supabase network call
  try {
    const headersList = headers();
    const headerUserId = headersList.get('x-user-id');
    const headerUserEmail = headersList.get('x-user-email');

    if (headerUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { supabaseAuthId: headerUserId },
        include: {
          department: true,
          student: true,
          faculty: true
        }
      });
      if (dbUser) {
        return {
          authUser: { id: headerUserId, email: headerUserEmail || dbUser.email },
          dbUser
        };
      }
    }
  } catch (error) {
    // headers() may throw if called outside a request context (e.g. static generation)
  }

  // 2. Fallback to full Supabase network call if headers are not present
  const supabase = createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch the extended user record from Prisma
    const dbUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      include: {
        department: true,
        student: true,
        faculty: true
      }
    });

    return { authUser: user, dbUser };
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export function verifyAccess(dbUser) {
  if (!dbUser) return { authorized: false, reason: 'unauthenticated' };
  if (dbUser.isBlocked) return { authorized: false, reason: 'blocked' };
  if (dbUser.approvalStatus !== 'APPROVED' && dbUser.role !== 'ADMIN') {
    return { authorized: false, reason: 'pending' };
  }
  return { authorized: true };
}

/**
 * Checks if the current user has the required role and valid access
 * @param {string[]} allowedRoles Array of allowed roles e.g., ['ADMIN', 'FACULTY']
 */
export async function requireRole(allowedRoles) {
  const userContext = await getUser();
  
  if (!userContext || !userContext.dbUser) {
    return { authorized: false, reason: 'unauthenticated' };
  }

  const access = verifyAccess(userContext.dbUser);
  if (!access.authorized) {
    return access; // returns blocked or pending reason
  }

  if (!allowedRoles.includes(userContext.dbUser.role)) {
    return { authorized: false, reason: 'forbidden' };
  }

  return { authorized: true, user: userContext };
}
