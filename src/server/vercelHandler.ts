process.env.VERCEL = process.env.VERCEL || '1';

import app from '../../server';

export default function handler(req: any, res: any) {
  // Extract original request path from various Vercel / proxy headers
  const originalPath =
    req.headers?.['x-matched-path'] ||
    req.headers?.['x-vercel-matched-path'] ||
    req.headers?.['x-forwarded-uri'] ||
    req.headers?.['x-original-url'] ||
    req.headers?.['x-rewrite-url'];

  if (originalPath && typeof originalPath === 'string' && originalPath.startsWith('/api')) {
    req.url = originalPath;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }

  return app(req, res);
}
