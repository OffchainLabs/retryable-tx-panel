import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Logo } from '@/components/Logo';
import { Providers } from '@/components/Providers';
import { Form } from '@/components/Form';
import './style.css';

const ConnectButton = dynamic(() => import('@/components/ConnectButton'), {
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
          Connect to either Ethereum mainnet or Sepolia to start the recovery
          process.
        </h2>
      </header>

      <div
        style={{
          marginTop: '20px',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '14px',
          color: 'white',
          backgroundColor: '#ffc10720',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #ffc107',
          maxWidth: '740px',
          margin: '0 auto',
        }}
      >
        Note: <b>This is a legacy tool.</b> You can now recover stuck funds in
        an aliased L2 address directly on the{' '}
        <a
          href="https://portal.arbitrum.io/bridge"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#4a9eff', textDecoration: 'underline' }}
        >
          official Arbitrum Bridge
        </a>
        . <br />
        When connected with the wallet address that initiated the deposit, the
        Bridge will automatically alert you about funds stuck in an aliased
        address.
      </div>

      <main>
        <Form />
        <Providers>
          {children}
          <Suspense>
            <ConnectButton />
          </Suspense>
        </Providers>
      </main>
    </>
  );
}
