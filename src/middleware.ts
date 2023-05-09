import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidTxHash } from '@/utils/isValidTxHash';
import { utils } from 'ethers';

export async function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  const txQuery = searchParams.get('t');

  // If the app is accessed through the old URL (/?t=${hash}) redirect to the new format (tx/:hash)
  if (txQuery) {
    return NextResponse.redirect(new URL(`/tx/${txQuery}`, request.url));
  }

  // Redirect on invalid hash (retryable dashboard)
  const txHash = pathname.split('tx/')[1];
  if (txHash && !isValidTxHash(txHash)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect on invalid address (recover-funds)
  const address = pathname.split('recover-funds/')[1];
  if (address && !utils.isAddress(address)) {
    return NextResponse.redirect(new URL('/recover-funds', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api/auth).*)(.+)', '/'],
};
