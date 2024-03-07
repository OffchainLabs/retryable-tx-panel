import { Logo } from '@/components/Logo';
import { Providers } from '@/components/Providers';
import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <>
      <header>
        <h1>All pending retryables:</h1>

        <Logo />
      </header>

      <main>
        <Providers>{children}</Providers>
      </main>
    </>
  );
}
