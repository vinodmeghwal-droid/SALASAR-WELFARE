import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import { authOptions } from '@/lib/auth';

/**
 * Backend-for-frontend proxy: the browser calls /api/backend/*, this handler checks the
 * Google session and forwards to the Express API with the server-only BACKEND_API_KEY.
 * Streams the response body, so the SSE endpoint (/api/backend/events) passes through live.
 */
export const dynamic = 'force-dynamic';

const ALLOWED_ROOTS = new Set(['officer-return', 'accident-tracker', 'insights', 'sync', 'events']);

async function forward(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { path } = await params;
  if (!ALLOWED_ROOTS.has(path[0])) return Response.json({ error: 'Not found' }, { status: 404 });

  const baseUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';
  const target = `${baseUrl}/api/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        'x-api-key': process.env.BACKEND_API_KEY ?? '',
        'content-type': 'application/json',
        accept: req.headers.get('accept') ?? 'application/json',
      },
      body: req.method === 'GET' ? undefined : await req.text(),
      cache: 'no-store',
      signal: req.signal,
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') ?? 'application/json',
        'cache-control': 'no-cache, no-transform',
        'x-accel-buffering': 'no',
      },
    });
  } catch (error) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error('Backend unreachable:', error);
    return Response.json({ error: 'Backend service is unreachable' }, { status: 502 });
  }
}

export { forward as GET, forward as POST };
