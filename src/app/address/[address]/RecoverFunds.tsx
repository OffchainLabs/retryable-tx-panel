import {
  getData,
  OperationInfo,
} from '@/app/recover-funds/[address]/RecoverFunds';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';

const RecoverFunds = dynamic(
  () => import('@/app/recover-funds/[address]/RecoverFunds'),
  {
    ssr: false,
  },
);

type Props = {
  address: string;
};
function RecoverFundsSnippet({ address }: Props) {
  const { chain } = useNetwork();
  const { isConnected } = useAccount();
  const [operationInfo, setOperationInfo] = useState<OperationInfo | null>(
    null,
  );

  useEffect(() => {
    async function fetchData() {
      if (!chain?.id) {
        return;
      }

      const data = await getData(chain.id, address);
      setOperationInfo(data);
    }

    fetchData();
  }, [address, chain?.id]);

  return (
    <>
      <h3>
        <Link href={`/recover-funds/${address}`}>Funds to recover</Link>
      </h3>

      {operationInfo && (
        <RecoverFunds operationInfo={operationInfo} address={address} />
      )}

      {!operationInfo && isConnected && <div>Loading...</div>}

      {!operationInfo && !isConnected && (
        <div>
          Connect to either Ethereum mainnet or Goerli to start the recovery
          process.
        </div>
      )}
    </>
  );
}

export default RecoverFundsSnippet;
