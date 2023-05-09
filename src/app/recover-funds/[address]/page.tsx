'use client';
import dynamic from 'next/dynamic';

const RecoverFunds = dynamic(() => import('./RecoverFunds'), {
  ssr: false,
});

const RecoverFundsPage = ({
  params: { address },
}: {
  params: { address: string };
}) => {
  return <RecoverFunds address={address} />;
};

export default RecoverFundsPage;
