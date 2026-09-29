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
        Note: <b>This is a legacy tool.</b> You can now check and redeem
        retryable tickets directly on the{' '}
        <a
          href="https://portal.arbitrum.io/build/retryables"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#4a9eff', textDecoration: 'underline' }}
        >
          Arbitrum Portal
        </a>
        .
      </div>

      <main>
        <Providers>
          <Form />
        </Providers>
      </main>
    </>
  );
};

export default PageIndex;
