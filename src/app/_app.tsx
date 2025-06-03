import React from 'react';
import { Saira, DM_Sans } from 'next/font/google';
import Head from 'next/head';
import type { AppProps } from 'next/app';

import './_app.css';
import { registerCustomArbitrumNetwork } from '@arbitrum/sdk';
import { ChainId, hyChain } from '@/utils/network';

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

registerCustomArbitrumNetwork({
  chainId: hyChain.id,
  confirmPeriodBlocks: 0,
  ethBridge: {
    inbox: '0xD6c596b7ca17870DD50D322393deCE6C2085a116',
  },
  isCustom: true,
  isTestnet: false,
  name: hyChain.name,
  parentChainId: ChainId.Mainnet,
  isBold: false,
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
