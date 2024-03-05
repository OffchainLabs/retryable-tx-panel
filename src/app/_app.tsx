import React from 'react';
import { Saira, DM_Sans } from 'next/font/google';
import Head from 'next/head';
import type { AppProps } from 'next/app';

import './_app.css';
import { safeAddDefaultLocalNetwork } from '@/utils/network';

const saira = Saira({
  weight: ['600', '700'],
  style: ['normal'],
  subsets: ['latin'],
});

const dm_sans = DM_Sans({
  weight: ['400', '700'],
  style: ['normal'],
  subsets: ['latin'],
});

if (process.env.NODE_ENV !== 'production') {
  safeAddDefaultLocalNetwork();
}

// Clear cache for everything related to WalletConnect v2.
//
// TODO: Remove this once the fix for the infinite loop / memory leak is identified.
Object.keys(localStorage).forEach((key) => {
  if (key === 'wagmi.requestedChains' || key.startsWith('wc@2')) {
    localStorage.removeItem(key);
  }
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Arbitrum Crosschain Message Dashboard</title>
      </Head>

      <div className={`${saira.className} ${dm_sans.className}`}>
        <Component {...pageProps} />
      </div>
    </>
  );
}
