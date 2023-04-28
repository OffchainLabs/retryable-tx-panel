'use client';
import { Address } from '@arbitrum/sdk';
import { BigNumber, utils, constants } from 'ethers';
import { useEffect, useState } from 'react';
import { useNetwork } from 'wagmi';
import { getProviderFromChainId, getTargetChainId } from '@/utils';
import { supportedL1Networks } from '@/constants';
import { RecoverFundsButton } from './RecoverFundsButton';

interface OperationInfo {
  balanceToRecover: BigNumber;
  aliasedAddress: string;
}

const hasBalanceOverThreshold = (balanceToRecover: BigNumber) => {
  // Aliased account will always have some leftover, we can't check for balance of 0, as it would always return 0
  // We can't compare with 0.0005 as it would throw error
  return balanceToRecover.mul(1_000).gte(5);
};

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
      balanceToRecover: hasBalanceOverThreshold(aliasedSignerBalance)
        ? aliasedSignerBalance
        : constants.Zero,
      aliasedAddress,
    };
  } catch (e) {
    return {
      balanceToRecover: BigNumber.from(100),
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

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const destinationAddress = formData
      .get('destinationAddressInput')
      ?.toString();

    if (destinationAddress && utils.isAddress(destinationAddress)) {
      setDestinationAddress(destinationAddress);
    } else {
      form.reset();
      setDestinationAddress(null);
    }
  };

  // No funds to recover
  if (
    chain &&
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
    chain &&
    operationInfo &&
    hasBalanceOverThreshold(operationInfo.balanceToRecover)
  ) {
    return (
      <div className="funds-message">
        There are {utils.formatEther(operationInfo.balanceToRecover)} ETH on{' '}
        {operationInfo.aliasedAddress} (Alias of {address}).
        <form className="form-container" onSubmit={handleSubmit}>
          <input
            name="destinationAddressInput"
            placeholder="Enter the destination address"
            className="input-style"
          />
          <input type="submit" value="Submit" />
        </form>
        {destinationAddress && (
          <RecoverFundsButton
            chainID={chain.id}
            balanceToRecover={operationInfo.balanceToRecover}
            destinationAddress={destinationAddress}
          />
        )}
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

  if (!targetChainID) {
    return null;
  }

  return <div className="funds-message">Loading...</div>;
};

export default RecoverFunds;
