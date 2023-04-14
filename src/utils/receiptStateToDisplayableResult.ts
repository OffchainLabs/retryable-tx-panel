import { AlertLevel, ReceiptState } from '@/types';

export const receiptStateToDisplayableResult = (
  l1ReceiptState: ReceiptState,
): {
  text: string;
  alertLevel: AlertLevel;
} => {
  switch (l1ReceiptState) {
    case ReceiptState.EMPTY:
      return {
        text: '',
        alertLevel: AlertLevel.NONE,
      };
    case ReceiptState.LOADING:
      return {
        text: 'Loading...',
        alertLevel: AlertLevel.NONE,
      };
    case ReceiptState.INVALID_INPUT_LENGTH:
      return {
        text: 'Error: invalid transaction hash',
        alertLevel: AlertLevel.RED,
      };
    case ReceiptState.NOT_FOUND:
      return {
        text: 'L1 transaction not found',
        alertLevel: AlertLevel.YELLOW,
      };
    case ReceiptState.L1_FAILED:
      return {
        text: 'Error: L1 transaction reverted',
        alertLevel: AlertLevel.RED,
      };
    case ReceiptState.L2_FAILED:
      return {
        text: 'Error: L2 transaction reverted',
        alertLevel: AlertLevel.RED,
      };
    case ReceiptState.NO_L1_L2_MESSAGES:
      return {
        text: 'No L1-to-L2 messages created by provided L1 transaction',
        alertLevel: AlertLevel.YELLOW,
      };
    case ReceiptState.MESSAGES_FOUND:
      return {
        text: 'Cross chain messages found',
        alertLevel: AlertLevel.GREEN,
      };
    case ReceiptState.NO_L2_L1_MESSAGES: {
      return {
        text: 'No L1-to-L2 messages created by provided L1 transaction',
        alertLevel: AlertLevel.YELLOW,
      };
    }
  }
};
