import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGINS: string[] = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.VITE_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter((o): o is string => typeof o === 'string' && o.length > 0);

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): void {
  const origin = req.headers.origin ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : '*';

  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (allowed !== '*') {
    res.setHeader('Vary', 'Origin');
  }
}

/**
 * Call at the top of every handler.
 * Returns true if the request was an OPTIONS preflight (caller should return immediately).
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}
