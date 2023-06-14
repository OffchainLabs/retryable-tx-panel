export type Retryable = {
  createdAtTxHash: `0x${string}`;
};
export type Deposit = {
  transactionHash: `0x${string}`;
  sender: `0x${string}`;
};
export type BridgeRetryable = {
  sender: `0x${string}`;
  transactionHash: `0x${string}`;
  retryableTicketID: `0x${string}`;
};
