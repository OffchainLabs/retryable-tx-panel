'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import PendingRetryables from '@/app/retryables-tracker/[address]/PendingRetryables';

const RecoverFunds = dynamic(() => import('./RecoverFunds'), {
  ssr: false,
});

type Props = {
  params: {
    address: string;
  };
};
const Page = async ({ params }: Props) => {
  const { address } = params;

  return (
    <>
      <RecoverFunds address={address} />

      <h3>
        <Link href={`/retryables-tracker/${address}`}>Pending retryables</Link>
      </h3>

      {/* @ts-expect-error Server Component */}
      <PendingRetryables address={address} />
    </>
  );
};

export default Page;
