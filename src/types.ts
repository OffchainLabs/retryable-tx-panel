import {
  L2ToL1Message,
  L2ToL1MessageStatus,
  L1ToL2MessageReader,
  L2Network,
  L1TransactionReceipt,
  L1Network,
} from '@arbitrum/sdk';

import {
  EthDepositMessage,
  L1ToL2MessageReaderClassic,
} from '@arbitrum/sdk/dist/lib/message/L1ToL2Message';

import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';

export enum ReceiptState {
  EMPTY,
  LOADING,
  INVALID_INPUT_LENGTH,
  NOT_FOUND,
  L1_FAILED,
  L2_FAILED,
  NO_L1_L2_MESSAGES,
  MESSAGES_FOUND,
  NO_L2_L1_MESSAGES,
}

export enum AlertLevel {
  RED,
  YELLOW,
  GREEN,
  NONE,
}

export interface L1ToL2MessageReaderWithNetwork extends L1ToL2MessageReader {
  l2Network: L2Network;
}

export interface L1ToL2MessageReaderClassicWithNetwork
  extends L1ToL2MessageReaderClassic {
  l2Network: L2Network;
}

export interface EthDepositMessageWithNetwork extends EthDepositMessage {
  l2Network: L2Network;
}

export interface L1ToL2MessagesAndDepositMessages {
  retryables: L1ToL2MessageReaderWithNetwork[];
  retryablesClassic: L1ToL2MessageReaderClassicWithNetwork[];
  deposits: EthDepositMessageWithNetwork[];
}

interface MessageStatusDisplayBase {
  text: string;
  alertLevel: AlertLevel;
  showRedeemButton: boolean;
  explorerUrl: string;
  l2Network: L2Network;
  l2TxHash: string;
}
interface MessageStatusDisplayRetryable extends MessageStatusDisplayBase {
  l1ToL2Message: L1ToL2MessageReader | L1ToL2MessageReaderClassic;
  ethDepositMessage: undefined;
}
interface MessageStatusDisplayDeposit extends MessageStatusDisplayBase {
  l1ToL2Message: undefined;
  ethDepositMessage: EthDepositMessage;
}
export type MessageStatusDisplay =
  | MessageStatusDisplayRetryable
  | MessageStatusDisplayDeposit;

export enum Status {
  CREATION_FAILURE,
  NOT_FOUND,
  REEXECUTABLE,
  SUCCEEDED,
}

export enum L2TxnStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  NOT_FOUND = 'NOT_FOUND',
}

export interface Result {
  status: Status;
  text: string;
}

export interface RetryableTxs {
  l1BlockExplorerUrl: string;
  l2BlockExplorerUrl: string;
  l1Tx?: string;
  l2Tx?: string;
  autoRedeem?: string;
  ticket?: string;
  result: Result;
  l2ChainId: number;
}

export interface ReceiptRes {
  l1TxnReceipt: L1TransactionReceipt;
  l1Network: L1Network;
  l1Provider: JsonRpcProvider;
}

export interface L2ToL1MessageData {
  status: L2ToL1MessageStatus;
  l2ToL1Message: L2ToL1Message;
  confirmationInfo: {
    deadlineBlock: BigNumber;
    etaSeconds: number;
  } | null;
  l1Network: L1Network;
  l2Network: L2Network;
  l2Provider: JsonRpcProvider;
  createdAtL2BlockNumber: number;
}

export interface L2ToL1MessageSearchResult {
  l2TxnStatus: L2TxnStatus;
  l2ToL1Messages: L2ToL1MessageData[];
  l2TxHash: string;
}
