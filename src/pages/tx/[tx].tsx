import React, { useCallback, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useNetwork, useSigner } from 'wagmi';
import { L2ToL1MessageStatus } from '@arbitrum/sdk';
import {
  ReceiptState,
  ReceiptRes,
  L2ToL1MessageData,
  MessageStatusDisplay,
  L2TxnStatus,
} from '../../types';
import {
  getRetryableIdOrDepositHash,
  receiptStateToDisplayableResult,
  l1ToL2MessageToStatusDisplay,
  getL2ToL1Messages,
  getL1TxnReceipt,
  getL1ToL2MessagesAndDepositMessages,
} from '../../lib';
import { L2ToL1MsgsDisplay } from '../../components/L2ToL1MsgsDisplay';
import { ExternalLink } from '../../components/ExternalLink';
import { Redeem } from '../../components/Redeem';
import { ConnectButtons } from '../../components/ConnectButtons';

const Transaction: NextPage = () => {
  const router = useRouter();
  const tx = (router.query.tx ?? '') as string;

  const { chain } = useNetwork();
  const { data: signer = null } = useSigner({ chainId: chain?.id });

  const [txHashState, setTxnHashState] = React.useState<ReceiptState>(
    ReceiptState.EMPTY,
  );

  const [l1TxnReceipt, setl1TxnReceipt] = React.useState<ReceiptRes>();
  const [messagesDisplays, setMessagesDisplays] = React.useState<
    MessageStatusDisplay[]
  >([]);

  const [l2ToL1MessagesToShow, setL2ToL1MessagesToShow] = React.useState<
    L2ToL1MessageData[]
  >([]);

  const { text: l1TxnResultText } =
    receiptStateToDisplayableResult(txHashState);

  const retryablesSearch = useCallback(async (txHash: string) => {
    setl1TxnReceipt(undefined);
    setMessagesDisplays([]);
    setL2ToL1MessagesToShow([]);
    setTxnHashState(ReceiptState.LOADING);

    if (txHash.length !== 66) {
      return setTxnHashState(ReceiptState.INVALID_INPUT_LENGTH);
    }

    const receiptRes = await getL1TxnReceipt(txHash);
    setl1TxnReceipt(receiptRes);

    if (receiptRes === undefined) {
      const res = await getL2ToL1Messages(txHash);
      // TODO: handle terminal states
      if (res.l2ToL1Messages.length > 0) {
        setTxnHashState(ReceiptState.MESSAGES_FOUND);
        return setL2ToL1MessagesToShow(res.l2ToL1Messages);
      }

      if (res.l2TxnStatus === L2TxnStatus.SUCCESS) {
        return setTxnHashState(ReceiptState.NO_L2_L1_MESSAGES);
      }
      if (res.l2TxnStatus === L2TxnStatus.FAILURE) {
        return setTxnHashState(ReceiptState.L2_FAILED);
      }

      return setTxnHashState(ReceiptState.NOT_FOUND);
    }
    const { l1Network, l1TxnReceipt } = receiptRes;
    if (l1TxnReceipt.status === 0) {
      return setTxnHashState(ReceiptState.L1_FAILED);
    }

    const allMessages = await getL1ToL2MessagesAndDepositMessages(
      l1TxnReceipt,
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
      return setTxnHashState(ReceiptState.NO_L1_L2_MESSAGES);
    }

    setTxnHashState(ReceiptState.MESSAGES_FOUND);

    const messageStatuses: MessageStatusDisplay[] = [];
    for (const l1ToL2Message of l1ToL2Messages) {
      const l1ToL2MessageStatus = await l1ToL2MessageToStatusDisplay(
        l1ToL2Message,
        false,
      );
      messageStatuses.push(l1ToL2MessageStatus);
    }

    for (const l1ToL2Message of l1ToL2MessagesClassic) {
      const l1ToL2MessageStatus = await l1ToL2MessageToStatusDisplay(
        l1ToL2Message,
        true,
      );
      messageStatuses.push(l1ToL2MessageStatus);
    }

    setMessagesDisplays(messageStatuses);
  }, []);

  useEffect(() => {
    retryablesSearch(tx);
  }, [retryablesSearch, tx]);

  return (
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

      <div>
        {txHashState === ReceiptState.MESSAGES_FOUND &&
          messagesDisplays.length === 0 &&
          l2ToL1MessagesToShow.length === 0 &&
          'Loading messages...'}
      </div>

      <L2ToL1MsgsDisplay
        signer={signer}
        l2ToL1Messages={l2ToL1MessagesToShow}
        connectedNetworkId={chain?.id}
      />

      {messagesDisplays.map((messageDisplay) => {
        return (
          <div
            className="text-align-center"
            key={getRetryableIdOrDepositHash(messageDisplay)}
          >
            {
              <>
                <h3>
                  L2{' '}
                  {messageDisplay.l2TxHash !== 'null' ? (
                    <ExternalLink
                      href={`${messageDisplay.explorerUrl}/tx/${messageDisplay.l2TxHash}`}
                    >
                      Transaction
                    </ExternalLink>
                  ) : (
                    'Transaction'
                  )}{' '}
                  status on {messageDisplay.l2Network.name}
                </h3>
                {messageDisplay.l1ToL2Message !== undefined && (
                  <ExternalLink
                    href={`${
                      messageDisplay.explorerUrl
                    }/tx/${getRetryableIdOrDepositHash(messageDisplay)}`}
                    showIcon
                  >
                    Check Your Retryable Ticket on{' '}
                    {messageDisplay.l2Network.name}
                  </ExternalLink>
                )}
                <p>{messageDisplay.text}</p>
                {messageDisplay.showRedeemButton && (
                  <Redeem
                    l1ToL2Message={messageDisplay}
                    signer={signer}
                    connectedNetworkId={chain?.id}
                  />
                )}
              </>
            }
          </div>
        );
      })}
      {(messagesDisplays.some((msg) => msg.showRedeemButton) ||
        l2ToL1MessagesToShow.some(
          (msg) => msg.status === L2ToL1MessageStatus.CONFIRMED,
        )) && <ConnectButtons />}
    </div>
  );
};

export default Transaction;
