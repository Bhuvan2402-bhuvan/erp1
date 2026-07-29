import prisma from './prisma';
import { headers, cookies } from 'next/headers';

/**
 * Gets the current authenticated user along with their Prisma database record (which contains role/approval status)
 */
export async function getUser() {
  let headerUserId = null;
  let headerUserEmail = null;

  try {
    const headersList = headers();
    const cookieList = cookies();

    headerUserId = headersList.get('x-user-id') || cookieList.get('x-user-id')?.value;
    headerUserEmail = headersList.get('x-user-email') || cookieList.get('x-user-email')?.value;
  } catch (e) {
    // Suppress dynamic usage errors during static page collection
  }

  try {
    let dbUser = null;

    if (headerUserEmail) {
      dbUser = await prisma.user.findUnique({
        where: { email: headerUserEmail },
        include: {
          department: true,
          student: true,
          faculty: true
        }
      });
    }

    if (!dbUser && headerUserId) {
      dbUser = await prisma.user.findUnique({
        where: { firebaseUid: headerUserId },
        include: {
          department: true,
          student: true,
          faculty: true
        }
      });
    }

    if (!dbUser) return null;

    return {
      authUser: { id: dbUser.firebaseUid, email: dbUser.email },
      dbUser
    };
  } catch (error) {
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
    return access;
  }

  if (!allowedRoles.includes(userContext.dbUser.role)) {
    return { authorized: false, reason: 'forbidden' };
  }

  return { authorized: true, user: userContext };
}
