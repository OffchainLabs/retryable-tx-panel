import React from 'react';
import Head from 'next/head';
import type { AppProps } from 'next/app';

import { Layout } from '../components/layout';
import { WagmiProvider } from '../components/WagmiProvider';

import './_app.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Crosschain Message Dashboard</title>
      </Head>

      <WagmiProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </WagmiProvider>
    </>
  );
}
