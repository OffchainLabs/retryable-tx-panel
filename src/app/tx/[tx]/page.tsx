import { L2ToL1MessageStatus } from '@arbitrum/sdk';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Providers } from '@/components/Providers';
import {
  getL1ToL2MessagesAndDepositMessages,
  getL1TxnReceipt,
  getL2ToL1Messages,
  receiptStateToDisplayableResult,
} from '@/utils';
import {
  L1ToL2MessagesAndDepositMessages,
  L2ToL1MessageData,
  L2TxnStatus,
  ReceiptRes,
  ReceiptState,
} from '@/types';
import { MessageDisplays } from './MessageDisplays';
import { L2ToL1MessageDataLike } from './L2ToL1MsgsDisplay';

const L2ToL1MsgsDisplay = dynamic(() => import('./L2ToL1MsgsDisplay'), {
  ssr: false,
});

async function getData(txHash: string) {
  const receiptRes = await getL1TxnReceipt(txHash);
  const l1TxnReceipt = receiptRes;
  const defaultReturn: {
    allMessages: L1ToL2MessagesAndDepositMessages;
    l2ToL1MessagesToShow: L2ToL1MessageData[];
    receiptRes: ReceiptRes | undefined;
  } = {
    allMessages: {
      retryables: [],
      retryablesClassic: [],
      deposits: [],
    },
    l2ToL1MessagesToShow: [],
    receiptRes,
  };

  if (receiptRes === undefined) {
    const res = await getL2ToL1Messages(txHash);
    const { l2TxnStatus, l2ToL1Messages } = res;

    // TODO: handle terminal states
    if (l2ToL1Messages.length > 0) {
      return {
        ...defaultReturn,
        l1TxnReceipt,
        txHashState: ReceiptState.MESSAGES_FOUND,
        l2ToL1MessagesToShow: l2ToL1Messages,
      };
    }
    if (l2TxnStatus === L2TxnStatus.SUCCESS) {
      return {
        ...defaultReturn,
        l1TxnReceipt,
        txHashState: ReceiptState.NO_L2_L1_MESSAGES,
      };
    }
    if (l2TxnStatus === L2TxnStatus.FAILURE) {
      return {
        ...defaultReturn,
        l1TxnReceipt,
        txHashState: ReceiptState.L2_FAILED,
      };
    }

    return {
      ...defaultReturn,
      l1TxnReceipt,
      txHashState: ReceiptState.NOT_FOUND,
    };
  }

  const { l1TxnReceipt: _l1TxnReceipt, l1Network } = receiptRes;
  if (_l1TxnReceipt.status === 0) {
    return {
      ...defaultReturn,
      l1TxnReceipt,
      txHashState: ReceiptState.L1_FAILED,
    };
  }

  const allMessages = await getL1ToL2MessagesAndDepositMessages(
    _l1TxnReceipt,
    l1Network,
  );
  const l1ToL2Messages = allMessages.retryables;
  const l1ToL2MessagesClassic = allMessages.retryablesClassic;
  const depositMessages = allMessages.deposits;
  if (
    l1ToL2Messages.length === 0 &&
    l1ToL2MessagesClassic.length === 0 &&
    depositMessages.length === 0
  ) {
    return {
      ...defaultReturn,
      l1TxnReceipt,
      txHashState: ReceiptState.NO_L1_L2_MESSAGES,
    };
  }

  return {
    ...defaultReturn,
    allMessages,
    l1TxnReceipt,
    receiptRes,
    txHashState: ReceiptState.MESSAGES_FOUND,
  };
}

type Props = {
  params: {
    tx: string;
  };
};
const Transaction = async ({ params }: Props) => {
  const { tx } = params;
  const {
    txHashState,
    l1TxnReceipt,
    l2ToL1MessagesToShow: _l2ToL1MessagesToShow,
    allMessages,
  } = await getData(tx);
  const { text: l1TxnResultText } =
    receiptStateToDisplayableResult(txHashState);
  const l2ToL1MessagesToShow: L2ToL1MessageDataLike[] =
    _l2ToL1MessagesToShow.map(
      ({
        confirmationInfo,
        status,
        l1Network,
        l2Network,
        createdAtL2BlockNumber,
        l2ToL1EventIndex,
      }) => ({
        status,
        confirmationInfo: confirmationInfo
          ? {
              deadlineBlock: confirmationInfo.deadlineBlock.toString(),
              etaSeconds: confirmationInfo.etaSeconds,
            }
          : null,
        l1Network: {
          chainID: l1Network.chainID,
          name: l1Network.name,
        },
        l2Network: {
          chainID: l2Network.chainID,
          name: l2Network.name,
        },
        createdAtL2BlockNumber,
        l2ToL1EventIndex,
      }),
    );

  return (
    <>
      <div className="resultContainer">
        <div className="receipt-text">
          {l1TxnReceipt && (
            <a
              href={
                l1TxnReceipt.l1Network.explorerUrl +
                '/tx/' +
                l1TxnReceipt.l1TxnReceipt.transactionHash
              }
              rel="noreferrer"
              target="_blank"
            >
              L1 Transaction on {l1TxnReceipt.l1Network.name}
            </a>
          )}{' '}
          {l1TxnResultText}{' '}
        </div>
      </div>
      <Providers>
        <L2ToL1MsgsDisplay l2ToL1Messages={l2ToL1MessagesToShow} />
        <Suspense fallback={<div>Loading messages...</div>}>
          {/* @ts-expect-error Server Component */}
          <MessageDisplays
            messages={allMessages}
            hasL2ToL1MessagesConfirmed={l2ToL1MessagesToShow.some(
              (msg) => msg.status !== L2ToL1MessageStatus.UNCONFIRMED, // Also show executed
            )}
          />
        </Suspense>
      </Providers>
    </>
  );
};

export default Transaction;
