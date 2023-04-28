import { NextPage } from 'next';
import { Logo } from '../components/Logo';
import Link from 'next/link';

const PageIndex: NextPage = () => {
  return (
    <>
      <header>
        <h1>Arbitrum Tools</h1>
        <Logo />
      </header>

      <main>
        <Link href="/tx" className="link">
          Arbitrum Cross-chain Message Dashboard
        </Link>
        <Link href="/recover-funds" className="link">
          Funds recovery tool
        </Link>
      </main>
    </>
  );

export default PageIndex;
