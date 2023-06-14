'use client';
import { getTargetChainId } from '@/utils';
import { utils } from 'ethers';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { useNetwork } from 'wagmi';
import {
  getData,
  hasBalanceOverThreshold,
  OperationInfo,
} from './RecoverFunds';
import { RecoverFundsButton } from './RecoverFundsButton';

const RecoverFunds = dynamic(() => import('./RecoverFunds'), {
  ssr: false,
});

const RecoverFundsPage = ({
  params: { address },
}: {
  params: { address: string };
}) => {
  const { chain } = useNetwork();
  const [operationInfo, setOperationInfo] = useState<OperationInfo | null>(
    null,
  );
  const [destinationAddress, setDestinationAddress] = useState<string | null>(
    null,
  );

  const targetChainID = getTargetChainId(chain?.id);

  useEffect(() => {
    if (!targetChainID) {
      return;
    }

    getData(targetChainID, address).then((data) => {
      setOperationInfo(data);
    });
  }, [address, targetChainID]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    setDestinationAddress(value);
  };

  if (!operationInfo) {
    return;
  }

  const hasBalanceToRecover = hasBalanceOverThreshold(
    operationInfo.balanceToRecover,
  );
  const hasDestinationAddress =
    chain &&
    destinationAddress &&
    utils.isAddress(destinationAddress) &&
    operationInfo.aliasedAddress;

  return (
    <>
      <RecoverFunds address={address} operationInfo={operationInfo} />
      {hasBalanceToRecover && (
        <div className="form-container">
          <input
            name="destinationAddressInput"
            placeholder="Enter the destination address"
            onChange={handleChange}
            className="input-style"
          />
        </div>
      )}
      {hasBalanceToRecover && hasDestinationAddress && (
        <RecoverFundsButton
          chainID={chain.id}
          balanceToRecover={operationInfo.balanceToRecover}
          destinationAddress={destinationAddress}
          addressToRecoverFrom={address}
        />
      )}
    </>
  );
};

export default RecoverFundsPage;
