/**
 * API base URL for fetch calls.
 * - Local dev: direct to backend (127.0.0.1:8000)
 * - Vercel prod: same-origin /api/* (proxied to Railway via next.config rewrites)
 */
const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

export const API_BASE =
  process.env.NODE_ENV === 'production' ? '' : configured ?? 'http://127.0.0.1:8000';
