import { MessageStatusDisplay } from '../types';

export const getRetryableIdOrDepositHash = (message: MessageStatusDisplay) => {
  if (message.parentToChildMessage !== undefined) {
    return message.parentToChildMessage.retryableCreationId;
  }
  return message.ethDepositMessage.childTxHash;
};
