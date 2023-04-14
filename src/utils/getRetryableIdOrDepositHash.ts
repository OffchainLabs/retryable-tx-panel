import { MessageStatusDisplay } from '../types';

export const getRetryableIdOrDepositHash = (message: MessageStatusDisplay) => {
  if (message.l1ToL2Message !== undefined) {
    return message.l1ToL2Message.retryableCreationId;
  }
  return message.ethDepositMessage.l2DepositTxHash;
};
