'use client';
import { Address } from '@arbitrum/sdk';
import { BigNumber, utils, constants } from 'ethers';
import { useEffect, useState } from 'react';
import { useNetwork } from 'wagmi';
import {
  getProviderFromChainId,
  getTargetChainId,
  supportedL1Networks,
} from '../../../lib';
import { RecoverFundsButton } from './RecoverFundsButton';

interface OperationInfo {
  balanceToRecover: BigNumber;
  aliasedAddress: string;
}

async function getData(
  chainID: number,
  address: string,
): Promise<OperationInfo | null> {
  // First, obtain the aliased address of the signer
  const signerAddress = new Address(address);
  const { value: aliasedAddress } = signerAddress.applyAlias();

  // And get its balance to find out the amount we are transferring
  try {
    const l2Provider = getProviderFromChainId(chainID);
    const aliasedSignerBalance = await l2Provider.getBalance(aliasedAddress);

    return {
      balanceToRecover: aliasedSignerBalance.eq(0)
        ? constants.Zero
        : aliasedSignerBalance,
      aliasedAddress,
    };
  } catch (e) {
    return {
      balanceToRecover: constants.Zero,
      aliasedAddress,
    };
  }
}

const RecoverFunds = ({ address }: { address: string }) => {
  const { chain } = useNetwork();
  const [operationInfo, setOperationInfo] = useState<OperationInfo | null>(
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

  // No funds to recover
  if (true && chain && operationInfo?.balanceToRecover.eq(0)) {
    return (
      <div className="funds-message">
        There are no funds stuck on {operationInfo.aliasedAddress} (Alias of{' '}
        {address}) on this network ({targetChainID}).
      </div>
    );
  }

  // Funds found on aliased address
  if (chain && operationInfo?.balanceToRecover.gt(0)) {
    return (
      <div className="funds-message">
        There are {utils.formatEther(operationInfo.balanceToRecover)} ETH on{' '}
        {operationInfo.aliasedAddress} (Alias of {address}).
        <RecoverFundsButton
          chainID={chain.id}
          address={address}
          balanceToRecover={operationInfo.balanceToRecover}
        />
      </div>
    );
  }

  // User is connected on wrong network
  if (chain?.id && !(chain.id in supportedL1Networks)) {
    return (
      <div className="funds-message">
        You are connected to an unsupported network. Please connect to Ethereum
        mainnet or Goerli.
      </div>
    );
  }

  return <div className="funds-message">Loading...</div>;
};

export default RecoverFunds;
