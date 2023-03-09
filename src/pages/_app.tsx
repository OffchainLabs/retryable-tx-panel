import React from 'react';
import { Saira, DM_Sans } from 'next/font/google';
import Head from 'next/head';
import type { AppProps } from 'next/app';

import { Layout } from '../components/layout';
import { WagmiProvider } from '../components/WagmiProvider';

import './_app.css';

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

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Crosschain Message Dashboard</title>
      </Head>

      <WagmiProvider>
        <div className={`${saira.className} ${dm_sans.className}`}>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </div>
      </WagmiProvider>
    </>
  );
}
