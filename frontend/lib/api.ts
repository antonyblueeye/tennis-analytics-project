/**
 * API base URL for fetch calls.
 * Vercel: set NEXT_PUBLIC_API_URL to your Railway FastAPI URL and redeploy.
 * Verify backend: GET {URL}/health → {"status":"ok"}
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';
