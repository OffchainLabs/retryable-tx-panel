import {
  ArbitrumNetwork,
  ChildToParentMessage,
  ChildToParentMessageStatus,
  ParentToChildMessageReader,
  ParentTransactionReceipt,
} from '@arbitrum/sdk';

import {
  EthDepositMessage,
  ParentToChildMessageReaderClassic,
} from '@arbitrum/sdk/dist/lib/message/ParentToChildMessage';

import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';

export enum ReceiptState {
  EMPTY,
  LOADING,
  INVALID_INPUT_LENGTH,
  NOT_FOUND,
  PARENT_FAILED,
  CHILD_FAILED,
  NO_PARENT_TO_CHILD_MESSAGES,
  MESSAGES_FOUND,
  NO_CHILD_TO_PARENT_MESSAGES,
}

export enum AlertLevel {
  RED,
  YELLOW,
  GREEN,
  NONE,
}

export interface ParentToChildMessageReaderWithNetwork
  extends ParentToChildMessageReader {
  childNetwork: ArbitrumNetwork;
}

export interface ParentToChildMessageReaderClassicWithNetwork
  extends ParentToChildMessageReaderClassic {
  childNetwork: ArbitrumNetwork;
}

export interface EthDepositMessageWithNetwork extends EthDepositMessage {
  childNetwork: ArbitrumNetwork;
}

export interface ParentToChildMessagesAndDepositMessages {
  retryables: ParentToChildMessageReaderWithNetwork[];
  retryablesClassic: ParentToChildMessageReaderClassicWithNetwork[];
  deposits: EthDepositMessageWithNetwork[];
}

interface MessageStatusDisplayBase {
  text: string;
  alertLevel: AlertLevel;
  showRedeemButton: boolean;
  explorerUrl: string;
  childNetwork: ArbitrumNetwork;
  childTxHash: string;
}
interface MessageStatusDisplayRetryable extends MessageStatusDisplayBase {
  parentToChildMessage:
    | ParentToChildMessageReader
    | ParentToChildMessageReaderClassic;
  ethDepositMessage: undefined;
  autoRedeemHash: string | undefined;
}
interface MessageStatusDisplayDeposit extends MessageStatusDisplayBase {
  parentToChildMessage: undefined;
  ethDepositMessage: EthDepositMessage;
  autoRedeemHash: string | undefined;
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

export enum ChildTxnStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  NOT_FOUND = 'NOT_FOUND',
}

export interface Result {
  status: Status;
  text: string;
}

export interface RetryableTxs {
  parentBlockExplorerUrl: string;
  childBlockExplorerUrl: string;
  parentTx?: string;
  childTx?: string;
  autoRedeem?: string;
  ticket?: string;
  result: Result;
  childChainId: number;
}

export interface ReceiptRes {
  parentTxnReceipt: ParentTransactionReceipt;
  parentNetwork: {
    chainId: number;
    name: string;
  };
  parentProvider: JsonRpcProvider;
}

export interface ChildToParentMessageData {
  status: ChildToParentMessageStatus;
  childToParentMessage: ChildToParentMessage;
  confirmationInfo: {
    deadlineBlock: BigNumber;
    etaSeconds: number;
  } | null;
  parentNetwork: {
    chainId: number;
    name: string;
  };
  childNetwork: ArbitrumNetwork;
  childProvider: JsonRpcProvider;
  createdAtChildBlockNumber: number;
  childToParentEventIndex: number;
}

export interface ChildToParentMessageSearchResult {
  childTxnStatus: ChildTxnStatus;
  childToParentMessages: ChildToParentMessageData[];
  childTxHash: string;
}
