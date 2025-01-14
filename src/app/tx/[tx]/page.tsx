import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Providers } from '@/components/Providers';
import {
  getChildToParentMessages,
  getParentToChildMessagesAndDepositMessages,
  getParentTxnReceipt,
  receiptStateToDisplayableResult,
} from '@/utils';
import {
  ChildToParentMessageData,
  ChildTxnStatus,
  ParentToChildMessagesAndDepositMessages,
  ReceiptRes,
  ReceiptState,
} from '@/types';
import { MessageDisplays } from './MessageDisplays';
import { ChildToParentMessageDataLike } from './ChildToParentMsgsDisplay';
import { getExplorer } from '@/utils/getExplorer';
import { ChildToParentMessageStatus } from '@arbitrum/sdk';

const ChildToParentMsgsDisplay = dynamic(
  () => import('./ChildToParentMsgsDisplay'),
  {
    ssr: false,
  },
);

async function getData(txHash: string) {
  const parentTxnReceipt = await getParentTxnReceipt(txHash);
  const defaultReturn: {
    allMessages: ParentToChildMessagesAndDepositMessages;
    childToParentMessagesToShow: ChildToParentMessageData[];
    receiptRes: ReceiptRes | undefined;
  } = {
    allMessages: {
      retryables: [],
      retryablesClassic: [],
      deposits: [],
    },
    childToParentMessagesToShow: [],
    receiptRes: parentTxnReceipt,
  };

  if (parentTxnReceipt === undefined) {
    const res = await getChildToParentMessages(txHash);
    const { childTxnStatus, childToParentMessages } = res;

    // TODO: handle terminal states
    if (childToParentMessages.length > 0) {
      return {
        ...defaultReturn,
        parentTxnReceipt,
        txHashState: ReceiptState.MESSAGES_FOUND,
        childToParentMessagesToShow: childToParentMessages,
      };
    }
    if (childTxnStatus === ChildTxnStatus.SUCCESS) {
      return {
        ...defaultReturn,
        parentTxnReceipt,
        txHashState: ReceiptState.NO_CHILD_TO_PARENT_MESSAGES,
      };
    }
    if (childTxnStatus === ChildTxnStatus.FAILURE) {
      return {
        ...defaultReturn,
        parentTxnReceipt,
        txHashState: ReceiptState.CHILD_FAILED,
      };
    }

    return {
      ...defaultReturn,
      parentTxnReceipt,
      txHashState: ReceiptState.NOT_FOUND,
    };
  }

  const { parentTxnReceipt: _parentTxnReceipt, parentNetwork } =
    parentTxnReceipt;
  if (_parentTxnReceipt.status === 0) {
    return {
      ...defaultReturn,
      parentTxnReceipt,
      txHashState: ReceiptState.PARENT_FAILED,
    };
  }

  const allMessages = await getParentToChildMessagesAndDepositMessages(
    _parentTxnReceipt,
    parentNetwork.chainId,
  );
  const parentToChildMessages = allMessages.retryables;
  const parentToChildMessagesClassic = allMessages.retryablesClassic;
  const depositMessages = allMessages.deposits;
  if (
    parentToChildMessages.length === 0 &&
    parentToChildMessagesClassic.length === 0 &&
    depositMessages.length === 0
  ) {
    return {
      ...defaultReturn,
      parentTxnReceipt,
      txHashState: ReceiptState.NO_PARENT_TO_CHILD_MESSAGES,
    };
  }

  return {
    ...defaultReturn,
    allMessages,
    parentTxnReceipt,
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
    parentTxnReceipt,
    childToParentMessagesToShow: _childToParentMessagesToShow,
    allMessages,
  } = await getData(tx);

  const { text: parentTxnResultText } =
    receiptStateToDisplayableResult(txHashState);

  const childToParentMessagesToShow: ChildToParentMessageDataLike[] =
    _childToParentMessagesToShow.map(
      ({
        confirmationInfo,
        status,
        parentNetwork,
        childNetwork,
        createdAtChildBlockNumber,
        childToParentEventIndex,
      }) => ({
        status,
        confirmationInfo: confirmationInfo
          ? {
              deadlineBlock: confirmationInfo.deadlineBlock.toString(),
              etaSeconds: confirmationInfo.etaSeconds,
            }
          : null,
        parentNetwork: {
          chainId: parentNetwork.chainId,
          name: parentNetwork.name,
        },
        childNetwork: {
          chainId: childNetwork.chainId,
          name: childNetwork.name,
        },
        createdAtChildBlockNumber,
        childToParentEventIndex,
      }),
    );

  return (
    <>
      <div className="resultContainer">
        <div className="receipt-text">
          {parentTxnReceipt && (
            <a
              href={
                getExplorer(parentTxnReceipt.parentNetwork.chainId) +
                '/tx/' +
                parentTxnReceipt.parentTxnReceipt.transactionHash
              }
              rel="noreferrer"
              target="_blank"
            >
              L1 Transaction on {parentTxnReceipt.parentNetwork.name}
            </a>
          )}{' '}
          {parentTxnResultText}{' '}
        </div>
      </div>
      <Providers>
        <div className="resultContainer">
          <ChildToParentMsgsDisplay
            childToParentMessages={childToParentMessagesToShow}
          />
          <Suspense fallback={<div>Loading messages...</div>}>
            {/* @ts-expect-error Server Component */}
            <MessageDisplays
              messages={allMessages}
              hasChildToParentMessagesConfirmed={childToParentMessagesToShow.some(
                (msg) => msg.status !== ChildToParentMessageStatus.UNCONFIRMED, // Also show executed
              )}
            />
          </Suspense>
        </div>
      </Providers>
    </>
  );
};

export default Transaction;
