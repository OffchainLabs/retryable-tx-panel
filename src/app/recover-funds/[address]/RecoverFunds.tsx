import { BigNumber, utils } from 'ethers';
import '../style.css';

export interface OperationInfo {
  balanceToRecover: BigNumber;
  aliasedAddress: string;
  chainId: string;
}

export const hasBalanceOverThreshold = (balanceToRecover: BigNumber) => {
  // Aliased account will always have some leftover, we can't check for balance of 0, as it would always return 0
  // We compare with 0.005 instead
  return balanceToRecover.gte(BigNumber.from(5_000_000_000_000_000));
};

type Props = {
  operationInfo: OperationInfo;
  address: string;
};
const RecoverFunds = ({ operationInfo, address }: Props) => {
  const l2ChainId = operationInfo.chainId;

  return (
    <div className="funds-message">
      There are {utils.formatEther(operationInfo.balanceToRecover)} ETH on{' '}
      {operationInfo.aliasedAddress}
      <br />
      (Alias of {address}) on this network {l2ChainId ?? ''}.
    </div>
  );
};

export default RecoverFunds;
