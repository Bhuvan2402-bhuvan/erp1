/**
 * lib/fetch-api.js
 *
 * Central fetch wrapper for the NSS ERP frontend.
 *
 * Routing logic:
 *  - Handles API requests directly to Next.js / Supabase API routes.
 *  - Automatically attaches the Supabase JWT Bearer token when available.
 *  - Absolute URLs (http/https) are called as-is with the Bearer token.
 *
 * Usage:
 *   import { apiFetch } from '@/lib/fetch-api';
 *
 *   const res = await apiFetch('/api/events');
 *   const events = await res.json();
 */

import { createClient } from '@/lib/supabase/client';

// ─── Token retrieval ──────────────────────────────────────────────────────────

/**
 * Get the active Supabase JWT without requiring the React context.
 * Safe to call from non-component code (utilities, server actions, etc.).
 *
 * @returns {Promise<string|null>}
 */
export async function getAccessToken() {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

// ─── URL resolution ───────────────────────────────────────────────────────────

/**
 * Resolves an endpoint to a full URL.
 *
 * @param {string} endpoint  e.g. "/api/events" or "https://example.com/data"
 * @returns {string}
 */
function resolveUrl(endpoint) {
  if (!endpoint) return '/';
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }

  let apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (apiBase && endpoint.startsWith('/api/')) {
    apiBase = apiBase.replace(/\/$/, '');
    if (!apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
      const protocol = apiBase.includes('localhost') || apiBase.includes('127.0.0.1') ? 'http://' : 'https://';
      apiBase = `${protocol}${apiBase}`;
    }
    return `${apiBase}${endpoint}`;
  }

  // Fallback to absolute relative path for same-origin Next.js routes
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
}

// ─── Main fetch wrapper ───────────────────────────────────────────────────────

/**
 * Token-aware fetch wrapper.
 *
 * Automatically:
 *  1. Resolves the endpoint to the correct base URL.
 *  2. Retrieves the Supabase JWT and attaches it as a Bearer token.
 *  3. Merges caller-supplied headers without overwriting Content-Type.
 *
 * @param {string}       endpoint  Relative path (e.g. "/api/events") or absolute URL
 * @param {RequestInit}  options   Standard fetch options (method, body, headers, …)
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
  const url   = resolveUrl(endpoint);
  const token = await getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * GET request with auth.
 * @param {string} endpoint
 * @param {RequestInit} [options]
 */
export const apiGet = (endpoint, options = {}) =>
  apiFetch(endpoint, { ...options, method: 'GET' });

/**
 * POST request with auth and JSON body.
 * @param {string} endpoint
 * @param {object} body
 * @param {RequestInit} [options]
 */
export const apiPost = (endpoint, body, options = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });

/**
 * PUT request with auth and JSON body.
 * @param {string} endpoint
 * @param {object} body
 * @param {RequestInit} [options]
 */
export const apiPut = (endpoint, body, options = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });

/**
 * PATCH request with auth and JSON body.
 * @param {string} endpoint
 * @param {object} body
 * @param {RequestInit} [options]
 */
export const apiPatch = (endpoint, body, options = {}) =>
  apiFetch(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  });

/**
 * DELETE request with auth.
 * @param {string} endpoint
 * @param {RequestInit} [options]
 */
export const apiDelete = (endpoint, options = {}) =>
  apiFetch(endpoint, { ...options, method: 'DELETE' });
