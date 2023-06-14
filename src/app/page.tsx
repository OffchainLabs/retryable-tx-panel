import { NextPage } from 'next';
import { WagmiProvider } from '@/components/WagmiProvider';
import { Logo } from '@/components/Logo';
import { Form } from '@/components/Form';

const PageIndex: NextPage = () => {
  return (
    <>
      <header>
        <h1>Arbitrum Tools</h1>
        <Logo />
      </header>

      <main>
        <WagmiProvider>
          <Form />
        </WagmiProvider>
      </main>
    </>
  );
};

export default PageIndex;
