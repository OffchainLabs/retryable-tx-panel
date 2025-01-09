import Link from 'next/link';
import { Suspense } from 'react';
import PendingRetryables from './PendingRetryables';

export const dynamic = 'force-dynamic';

const Page = async ({ params }: { params: { address: string } }) => {
  const { address } = params;

  return (
    <>
      <Link href={`/recover-funds/${address}`}>Recover funds page</Link>

      <h3>Pending Retryables</h3>
      <Suspense fallback={<div>Loading...</div>}>
        {/* @ts-expect-error Server Component */}
        <PendingRetryables address={address} />
      </Suspense>
    </>
  );
};

export default Page;
