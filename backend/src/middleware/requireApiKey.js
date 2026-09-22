import { timingSafeEqual } from 'node:crypto';

/**
 * The API is only called by the Next.js server (which has already verified the
 * user's Google session), never by browsers directly. It authenticates with a shared key.
 */
export function requireApiKey(expectedKey) {
  const expected = Buffer.from(expectedKey);
  return (req, res, next) => {
    const provided = Buffer.from(String(req.get('x-api-key') ?? ''));
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };
}
