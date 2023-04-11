import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidTxHash } from './isValidTxHash';

export async function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  const txQuery = searchParams.get('t');

  // If the app is accessed through the old URL (/?t=${hash}) redirect to the new format (tx/:hash)
  if (txQuery) {
    return NextResponse.redirect(new URL(`/tx/${txQuery}`, request.url));
  }

  // Redirect on invalid hash
  const txSlug = pathname.split('tx/')[1];
  if (txSlug && !isValidTxHash(txSlug)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api/auth).*)(.+)', '/'],
};
