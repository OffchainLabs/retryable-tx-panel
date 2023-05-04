'use client';
import { Address } from '@arbitrum/sdk';
import { BigNumber, utils, constants } from 'ethers';
import { useEffect, useState } from 'react';
import { useNetwork } from 'wagmi';
import { getProviderFromChainId, getTargetChainId } from '@/utils';
import { RecoverFundsButton } from './RecoverFundsButton';

interface OperationInfo {
  balanceToRecover: BigNumber;
  aliasedAddress: string;
}

const hasBalanceOverThreshold = (balanceToRecover: BigNumber) => {
  // Aliased account will always have some leftover, we can't check for balance of 0, as it would always return 0
  // We compare with 0.005 instead
  return balanceToRecover.gte(BigNumber.from(5_000_000_000_000_000));
};

async function getData(
  chainID: number,
  address: string,
): Promise<OperationInfo | null> {
  // First, obtain the aliased address of the signer
  const destinationAddress = new Address(address);
  const { value: aliasedAddress } = destinationAddress.applyAlias();

  // And get its balance to find out the amount we are transferring
  try {
    const l2Provider = getProviderFromChainId(chainID);
    const aliasedSignerBalance = await l2Provider.getBalance(aliasedAddress);

    return {
      balanceToRecover: hasBalanceOverThreshold(aliasedSignerBalance)
        ? aliasedSignerBalance
        : constants.Zero,
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

  // No funds to recover
  if (
    operationInfo &&
    !hasBalanceOverThreshold(operationInfo.balanceToRecover)
  ) {
    return (
      <div className="funds-message">
        There are no funds stuck on {operationInfo.aliasedAddress} (Alias of{' '}
        {address}) on this network{targetChainID ? ` (${targetChainID})` : ''}.
      </div>
    );
  }

  // Funds found on aliased address
  if (
    operationInfo &&
    hasBalanceOverThreshold(operationInfo.balanceToRecover)
  ) {
    return (
      <div className="funds-message">
        There are {utils.formatEther(operationInfo.balanceToRecover)} ETH on{' '}
        {operationInfo.aliasedAddress} (Alias of {address}).
        <div className="form-container">
          <input
            name="destinationAddressInput"
            placeholder="Enter the destination address"
            onChange={handleChange}
            className="input-style"
          />
        </div>
        {chain &&
          destinationAddress &&
          utils.isAddress(destinationAddress) &&
          operationInfo.aliasedAddress && (
            <RecoverFundsButton
              chainID={chain.id}
              balanceToRecover={operationInfo.balanceToRecover}
              destinationAddress={destinationAddress}
              aliasedAddress={operationInfo.aliasedAddress}
            />
          )}
      </div>
    );
  }

  return <div className="funds-message">Loading...</div>;
};

export default RecoverFunds;
