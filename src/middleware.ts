import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authConfig } from '@/lib/auth.config';
import { atLeast, type Role } from '@/lib/roles';

// Edge-safe instance built from the shared config (no adapter / no bcrypt).
const { auth } = NextAuth(authConfig);

// Paths under a protected prefix that must remain publicly reachable.
const PUBLIC_PATHS = ['/crew/shift-on'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const role = req.auth?.user?.role as Role | undefined;

  let allowed: boolean;
  if (pathname.startsWith('/auditor')) {
    allowed = role === 'auditor'; // exact match
  } else if (pathname.startsWith('/director')) {
    allowed = !!role && atLeast(role, 'director');
  } else if (pathname.startsWith('/gm')) {
    allowed = !!role && atLeast(role, 'mod');
  } else if (pathname.startsWith('/crew/intake')) {
    // Receiving is a receiver-and-above task (not general crew).
    allowed = !!role && atLeast(role, 'receiver');
  } else if (pathname.startsWith('/crew')) {
    allowed = !!role && atLeast(role, 'crew');
  } else {
    allowed = true;
  }

  if (allowed) return NextResponse.next();

  const url = req.nextUrl.clone();
  if (!role) {
    // Not signed in → crew PIN sign-in, preserving the intended destination.
    url.pathname = '/crew/shift-on';
    url.searchParams.set('callbackUrl', pathname);
  } else {
    // Signed in but insufficient role → home.
    url.pathname = '/';
  }
  return NextResponse.redirect(url);
});

export const config = {
  matcher: ['/crew/:path*', '/gm/:path*', '/director/:path*', '/auditor/:path*'],
};
