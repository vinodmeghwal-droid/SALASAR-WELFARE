import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

/** Route guard (Next 16 "proxy", formerly middleware): every page and API route needs a Google session. */
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const login = new URL('/login', req.url);
  login.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
