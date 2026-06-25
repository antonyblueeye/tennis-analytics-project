/** Railway/backend URL for client-side fetch (must include https:// on Vercel). */
function normalizeApiBase(raw: string | undefined): string {
  if (!raw?.trim()) return 'http://127.0.0.1:8000';
  let url = raw.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

export const API_BASE = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
