import React from 'react';
import { Info } from 'react-feather';
import Image from 'next/image';
import Logo from '../../public/logo.svg';
import { ExternalLink } from '../components/ExternalLink';

import 'react-tooltip/dist/react-tooltip.css';
import './global.css';
import { Form } from '../components/Form';

export type LayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        <header>
          <h1>
            Arbitrum Cross-chain Message Dashboard{' '}
            <ExternalLink
              id="title-info"
              href="https://developer.arbitrum.io/arbos/l1-to-l2-messaging"
              data-tooltip-content="Learn more about cross-chain messaging on Arbitrum"
            >
              <Info size={24} />
            </ExternalLink>
          </h1>
          <div className="header-logo">
            <Image src={Logo} alt="logo" priority />
          </div>
          <h2>Find out what&apos;s up with your cross-chain message</h2>
        </header>

        <main>
          <Form />
          {children}
        </main>
      </body>
    </html>
  );
}
