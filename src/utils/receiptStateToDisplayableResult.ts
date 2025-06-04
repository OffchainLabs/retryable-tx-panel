import { AlertLevel, ReceiptState } from '@/types';

export const receiptStateToDisplayableResult = (
  parentReceiptState: ReceiptState,
): {
  text: string;
  alertLevel: AlertLevel;
} => {
  switch (parentReceiptState) {
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
    case ReceiptState.PARENT_FAILED:
      return {
        text: 'Error: L1 transaction reverted',
        alertLevel: AlertLevel.RED,
      };
    case ReceiptState.CHILD_FAILED:
      return {
        text: 'Error: L2 transaction reverted',
        alertLevel: AlertLevel.RED,
      };
    case ReceiptState.NO_PARENT_TO_CHILD_MESSAGES:
      return {
        text: 'No L1-to-L2 messages created by provided L1 transaction',
        alertLevel: AlertLevel.YELLOW,
      };
    case ReceiptState.MESSAGES_FOUND:
      return {
        text: 'Cross chain messages found',
        alertLevel: AlertLevel.GREEN,
      };
    case ReceiptState.NO_CHILD_TO_PARENT_MESSAGES: {
      return {
        text: 'No L1-to-L2 messages created by provided L1 transaction',
        alertLevel: AlertLevel.YELLOW,
      };
    }
  }
};
