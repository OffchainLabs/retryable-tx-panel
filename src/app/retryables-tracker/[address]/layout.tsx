import { Form } from '@/components/Form';
import { Logo } from '@/components/Logo';
import { WagmiProvider } from '@/components/WagmiProvider';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <header>
        <h1>Retryables tracker</h1>

        <Logo />
      </header>

      <main>
        <Form />
        <WagmiProvider>{children}</WagmiProvider>
      </main>
    </>
  );
}
