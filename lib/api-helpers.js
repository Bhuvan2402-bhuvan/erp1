import { NextResponse } from 'next/server';
import { getUser, verifyAccess, requireRole } from './auth-helpers';

/**
 * Wraps an API route handler with authentication, access verification,
 * and standardized error handling. Reduces boilerplate across routes.
 *
 * @param {Function} handler - async (req, { params, user }) => NextResponse
 * @param {Object} options
 * @param {string[]} [options.roles] - Allowed roles. If omitted, any authenticated+approved user is allowed.
 */
export function withAuth(handler, options = {}) {
  return async (req, context) => {
    try {
      let userCtx;

      if (options.roles) {
        const auth = await requireRole(options.roles);
        if (!auth.authorized) {
          return NextResponse.json(
            { message: auth.reason === 'unauthenticated' ? 'Unauthorized' : 'Forbidden' },
            { status: auth.reason === 'unauthenticated' ? 401 : 403 }
          );
        }
        userCtx = auth.user;
      } else {
        userCtx = await getUser();
        if (!userCtx || !userCtx.dbUser) {
          return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const access = verifyAccess(userCtx.dbUser);
        if (!access.authorized) {
          return NextResponse.json({ message: access.reason }, { status: 403 });
        }
      }

      return await handler(req, { ...context, user: userCtx });
    } catch (error) {
      return sanitizeErrorResponse(error);
    }
  };
}

/**
 * Safely parse JSON from a request body. Returns { data, error }.
 * Prevents unhandled crashes from malformed JSON payloads.
 */
export async function parseJsonBody(req) {
  try {
    const data = await req.json();
    return { data, error: null };
  } catch {
    return { data: null, error: 'Invalid JSON in request body' };
  }
}

/**
 * Returns the resolved API endpoint URL
 * @param {string} endpoint - e.g., '/api/events'
 * @returns {string}
 */
export function getApiUrl(endpoint = '') {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!baseUrl) return cleanEndpoint;
  return `${baseUrl.replace(/\/$/, '')}${cleanEndpoint}`;
}

/**
 * Returns a generic 500 error response, stripping internal details
 * in production to avoid leaking stack traces or sensitive info.
 */
export function sanitizeErrorResponse(error, fallbackMessage = 'Internal server error') {
  // Log the full error server-side for debugging
  console.error('[API Error]', error);

  const isDev = process.env.NODE_ENV === 'development';

  return NextResponse.json(
    {
      message: fallbackMessage,
      ...(isDev && { debug: error?.message }),
    },
    { status: 500 }
  );
}

