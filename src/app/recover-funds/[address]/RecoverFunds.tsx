'use client';
import { Address } from '@arbitrum/sdk';
import { BigNumber, utils, constants } from 'ethers';
import { useNetwork } from 'wagmi';
import { getProviderFromChainId, getTargetChainId } from '@/utils';
import '../style.css';

export interface OperationInfo {
  balanceToRecover: BigNumber;
  aliasedAddress: string;
}

export const hasBalanceOverThreshold = (balanceToRecover: BigNumber) => {
  // Aliased account will always have some leftover, we can't check for balance of 0, as it would always return 0
  // We compare with 0.005 instead
  return balanceToRecover.gte(BigNumber.from(5_000_000_000_000_000));
};

export async function getData(
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

type Props = {
  operationInfo: OperationInfo;
  address: string;
};
const RecoverFunds = ({ operationInfo, address }: Props) => {
  const { chain } = useNetwork();
  const targetChainID = getTargetChainId(chain?.id);

  // No funds to recover
  if (!hasBalanceOverThreshold(operationInfo.balanceToRecover)) {
    return (
      <div className="funds-message">
        There are no funds stuck on {operationInfo.aliasedAddress}
        <br />
        (Alias of {address}) on this network
        {targetChainID ? ` (${targetChainID})` : ''}.
      </div>
    );
  }

  return (
    <div className="funds-message">
      There are {utils.formatEther(operationInfo.balanceToRecover)} ETH on{' '}
      {operationInfo.aliasedAddress}
      <br />
      (Alias of {address}).
    </div>
  );
};

export default RecoverFunds;
