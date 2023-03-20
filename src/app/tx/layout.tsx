import React from 'react';
import { Info } from 'react-feather';
import { ExternalLink } from '../../components/ExternalLink';
import { Form } from './Form';
import { Logo } from '../../components/Logo';

export type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
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

        <Logo />

        <h2>Find out what&apos;s up with your cross-chain message</h2>
      </header>

      <main>
        <Form />
        {children}
      </main>
    </>
  );
}
