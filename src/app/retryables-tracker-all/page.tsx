import { Suspense } from 'react';
import PendingRetryables from '../retryables-tracker/[address]/PendingRetryables';

const Page = async () => {
  return (
    <>
      <h3>Pending Retryables</h3>
      <Suspense fallback={<div>Loading...</div>}>
        {/* @ts-expect-error Server Component */}
        <PendingRetryables />
      </Suspense>
    </>
  );
};

export default Page;
