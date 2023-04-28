import {
  AlertLevel,
  EthDepositMessageWithNetwork,
  MessageStatusDisplay,
} from '@/types';

export const depositMessageStatusDisplay = async (
  ethDepositMessage: EthDepositMessageWithNetwork,
): Promise<MessageStatusDisplay> => {
  const { l2Network } = ethDepositMessage;
  const { explorerUrl } = l2Network;
  const depositTxReceipt = await ethDepositMessage.wait();
  const l2TxHash = ethDepositMessage.l2DepositTxHash;

  // naming is hard
  const stuffTheyAllHave = {
    l1ToL2Message: undefined,
    explorerUrl,
    l2Network,
    ethDepositMessage,
    l2TxHash,
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
