import { NextPage } from 'next';
import { Providers } from '@/components/Providers';
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
        <Providers>
          <Form />
        </Providers>
      </main>
    </>
  );
};

export default PageIndex;
