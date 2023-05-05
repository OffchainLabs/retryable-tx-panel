'use client';
import { Logo } from '../../components/Logo';
import { WagmiProvider } from '../../components/WagmiProvider';
import { Form } from './Form';
import dynamic from 'next/dynamic';
import './style.css';

const ConnectButton = dynamic(() => import('../../components/ConnectButton'), {
  ssr: false,
});

export type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <header>
        <h1>Arbitrum Funds Recovery Tool</h1>

        <Logo />

        <h2>
          Tool to recover funds that are locked in an aliased L2 address.
          <br />
          Connect to either Ethereum mainnet or Goerli to start the recovery
          process.
        </h2>
      </header>

      <main>
        <WagmiProvider>
          <Form />
          {children}
          <ConnectButton text="Connect" />
        </WagmiProvider>
      </main>
    </>
  );
}
