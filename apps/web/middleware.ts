import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const publicPaths = /^\/(?:api\/auth|_next\/static|_next\/image|favicon\.ico|images|icons)/;

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (publicPaths.test(pathname)) {
    const response = NextResponse.next();
    attachDeviceFingerprint(request, response);
    return response;
  }

  const response = intlMiddleware(request);

  if (pathname.startsWith('/api/')) {
    attachDeviceFingerprint(request, response);
  }

  return response;
}

function attachDeviceFingerprint(request: NextRequest, response: NextResponse) {
  const fingerprint = request.headers.get('x-device-fingerprint');
  if (fingerprint) {
    response.headers.set('x-device-fingerprint', fingerprint);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|icons).*)'],
};
