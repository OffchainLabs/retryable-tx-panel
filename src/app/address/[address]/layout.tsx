import { Form } from '@/components/Form';
import { Logo } from '@/components/Logo';
import { WagmiProvider } from '@/components/WagmiProvider';

export type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <header>
        <h1>Arbitrum Tools</h1>

        <Logo />

        <h2>Display information about a given address.</h2>
      </header>

      <main>
        <Form />
        <WagmiProvider>{children}</WagmiProvider>
      </main>
    </>
  );
}
