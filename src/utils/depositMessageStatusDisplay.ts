import {
  AlertLevel,
  EthDepositMessageWithNetwork,
  MessageStatusDisplay,
} from '@/types';
import { getExplorer } from './getExplorer';

export const depositMessageStatusDisplay = async (
  ethDepositMessage: EthDepositMessageWithNetwork,
): Promise<MessageStatusDisplay> => {
  const { childNetwork } = ethDepositMessage;
  const explorerUrl = getExplorer(childNetwork.chainId);

  const depositTxReceipt = await ethDepositMessage.wait();
  const childTxHash = ethDepositMessage.childTxHash;

  // naming is hard
  const stuffTheyAllHave = {
    parentToChildMessage: undefined,
    explorerUrl,
    childNetwork,
    ethDepositMessage,
    childTxHash,
    autoRedeemHash: undefined,
  };
  if (depositTxReceipt?.status === 1) {
    return {
      text: 'Success! 🎉 Your Eth deposit has completed',
      alertLevel: AlertLevel.GREEN,
      showRedeemButton: false,
      ...stuffTheyAllHave,
    };
  } else {
    return {
      text: 'Something failed in this tracker, you can try to check your account on l2',
      alertLevel: AlertLevel.RED,
      showRedeemButton: false,
      ...stuffTheyAllHave,
    };
  }
};
