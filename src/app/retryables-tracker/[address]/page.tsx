import { Suspense } from 'react';
import DepositRetryables from './DepositsRetryables';
import NonDepositsRetryables from './NonDepositsRetryables';
import PendingRetryables from './PendingRetryables';

const Page = async ({ params }: { params: { address: string } }) => {
  const { address } = params;

  return (
    <>
      <h3>Pending Retryables</h3>
      <Suspense fallback={<div>Loading...</div>}>
        {/* @ts-expect-error Server Component */}
        <PendingRetryables address={address} limit={10} />
      </Suspense>

      <h3>Deposit Retryables</h3>
      <Suspense fallback={<div>Loading deposit retryables...</div>}>
        {/* @ts-expect-error Server Component */}
        <DepositRetryables address={address} limit={10} />
      </Suspense>

      <h3>Non deposits Retryables</h3>
      <Suspense fallback={<div>Loading non deposit retryables...</div>}>
        {/* @ts-expect-error Server Component */}
        <NonDepositsRetryables address={address} limit={10} />
      </Suspense>
    </>
  );
};

export default Page;
