import { Logo } from '@/components/Logo';
import { WagmiProvider } from '@/components/WagmiProvider';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <header>
        <h1>All pending retryables:</h1>

        <Logo />
      </header>

      <main>
        <WagmiProvider>{children}</WagmiProvider>
      </main>
    </>
  );
}
