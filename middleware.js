import { NextResponse } from 'next/server';

// Simple JWT verifier for HS256 using Web Crypto (Edge runtime compatible)
async function verifyJwt(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [headerB64, payloadB64, signatureB64] = parts;

  const decode = (str) => {
    const padded = str.padEnd(str.length + (4 - (str.length % 4)) % 4, '=');
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return decoded;
  };

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
  const data = encoder.encode(`${headerB64}.${payloadB64}`);

  const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
  if (!isValid) return false;

  try {
    const payloadJson = JSON.parse(decode(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    if (payloadJson.exp && now >= payloadJson.exp) return false;
    return true;
  } catch {
    return false;
  }
}

const PUBLIC_PATHS = ['/', '/signin', '/signup', '/favicon.svg', '/_next'];

export async function middleware(request) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Middleware-Executed', 'true');

  const pathname = request.nextUrl.pathname;

  // Logging for demonstration
  console.log(`[Middleware] ${request.method} ${pathname} - ${new Date().toISOString()}`);

  // Always allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return response;
  }

  // Only protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('authToken')?.value;
    const secret = process.env.JWT_SECRET;

    const valid = await verifyJwt(token, secret);
    if (!valid) {
      const url = request.nextUrl.clone();
      url.pathname = '/signin';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.svg|images|.*\\.svg|.*\\.png|.*\\.jpg).*)',
  ],
};
