'use client';
import { mapChainIdToName, supportedL2Networks } from '@/utils/network';
import { Address } from '@arbitrum/sdk';
import { constants, utils } from 'ethers';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { useNetwork } from 'wagmi';
import { hasBalanceOverThreshold, OperationInfo } from './RecoverFunds';
import { RecoverFundsButton } from './RecoverFundsButton';
import { JsonRpcProvider } from '@ethersproject/providers';

const RecoverFunds = dynamic(() => import('./RecoverFunds'), {
  ssr: false,
});

type OperationInfoByChainId = {
  [chainId: string]: OperationInfo & { error?: true };
};
async function getOperationInfoByChainId(
  address: string,
): Promise<OperationInfoByChainId> {
  // First, obtain the aliased address of the signer
  const destinationAddress = new Address(address);
  const { value: aliasedAddress } = destinationAddress.applyAlias();

  // And get its balance to find out the amount we are transferring
  const operationInfoPromises = Object.entries(supportedL2Networks).map(
    async ([chainId, rpcURL]) => {
      const l2Provider = new JsonRpcProvider(rpcURL);

      try {
        const aliasedSignerBalance = await l2Provider.getBalance(
          aliasedAddress,
        );

        return {
          balanceToRecover: hasBalanceOverThreshold(aliasedSignerBalance)
            ? aliasedSignerBalance
            : constants.Zero,
          aliasedAddress,
          chainId,
        };
      } catch (e) {
        return {
          balanceToRecover: constants.Zero,
          aliasedAddress,
          chainId,
          error: true,
        };
      }
    },
  );

  const result = Promise.all(operationInfoPromises);
  return result.then((operationInfo) => {
    return operationInfo.reduce(
      (acc, info) => ({
        ...acc,
        [info.chainId]: info,
      }),
      {},
    );
  });
}

function RecoverFundsDetail({
  operationInfo,
  address,
}: {
  operationInfo: OperationInfo;
  address: string;
}) {
  const { chain } = useNetwork();
  const [destinationAddress, setDestinationAddress] = useState<string | null>(
    null,
  );

  const hasBalanceToRecover = hasBalanceOverThreshold(
    operationInfo.balanceToRecover,
  );
  const hasDestinationAddress =
    chain &&
    destinationAddress &&
    utils.isAddress(destinationAddress) &&
    operationInfo.aliasedAddress;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    setDestinationAddress(value);
  };

  const [checkboxAccepted, setCheckboxAccepted] = useState(false);

  if (!hasBalanceOverThreshold(operationInfo.balanceToRecover)) {
    return null;
  }

  return (
    <>
      <RecoverFunds address={address} operationInfo={operationInfo} />
      {hasBalanceToRecover && (
        <div className="form-container">
          <input
            name="destinationAddressInput"
            placeholder={`Enter which address you want to send the funds to on ${
              mapChainIdToName[operationInfo.chainId]
            }`}
            onChange={handleChange}
            className="input-style"
          />
        </div>
      )}
      {hasDestinationAddress && (
        <>
          <input
            type="checkbox"
            id="recover-checkbox"
            className="w-auto"
            onChange={(e) => setCheckboxAccepted(e.target.checked)}
          />
          <label htmlFor="recover-checkbox">
            I understand I need to control the address on{' '}
            {mapChainIdToName[operationInfo.chainId]}, or funds will be lost
            forever!
          </label>
        </>
      )}
      {checkboxAccepted && hasBalanceToRecover && hasDestinationAddress && (
        <RecoverFundsButton
          chainID={Number(operationInfo.chainId)}
          balanceToRecover={operationInfo.balanceToRecover}
          destinationAddress={destinationAddress}
          addressToRecoverFrom={address}
        />
      )}
    </>
  );
}

const RecoverFundsPage = ({
  params: { address },
}: {
  params: { address: string };
}) => {
  const [operationInfos, setOperationInfos] =
    useState<OperationInfoByChainId | null>(null);

  useEffect(() => {
    getOperationInfoByChainId(address).then((operationInfoByChainId) => {
      setOperationInfos(operationInfoByChainId);
    });
  }, [address]);

  if (!operationInfos) {
    return <div>Loading...</div>;
  }

  const operationInfoKeys = Object.keys(operationInfos);
  // No balance to recover on any chains
  if (
    operationInfoKeys.every(
      (chainId) =>
        !hasBalanceOverThreshold(operationInfos[chainId].balanceToRecover),
    )
  ) {
    const aliasedAddress = operationInfos[operationInfoKeys[0]].aliasedAddress;
    const errors = operationInfoKeys.filter(
      (operationInfoKey) => operationInfos[operationInfoKey].error,
    );

    if (errors.length > 0) {
      return (
        <div className="funds-message error">
          There was an error checking the balance of {aliasedAddress}
          <br />
          (Alias of {address}) on Arbitrum networks
        </div>
      );
    }

    return (
      <div className="funds-message">
        There are no funds stuck on {aliasedAddress}
        <br />
        (Alias of {address}) on Arbitrum networks
      </div>
    );
  }

  return (
    <>
      {Object.keys(operationInfos).map((chainId) => (
        <RecoverFundsDetail
          address={address}
          operationInfo={operationInfos[chainId]}
          key={chainId}
        />
      ))}
    </>
  );
};

export default RecoverFundsPage;
