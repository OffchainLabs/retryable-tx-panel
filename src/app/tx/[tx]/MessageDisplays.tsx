import dynamic from 'next/dynamic';
import { ExternalLink } from '@/components/ExternalLink';
import {
  depositMessageStatusDisplay,
  getRetryableIdOrDepositHash,
  l1ToL2MessageToStatusDisplay,
} from '@/utils';
import {
  L1ToL2MessagesAndDepositMessages,
  MessageStatusDisplay,
} from '@/types';

const getDataFromL1ToL2Message = (
  l1ToL2Message: MessageStatusDisplay['l1ToL2Message'],
) => {
  if (l1ToL2Message && 'sender' in l1ToL2Message) {
    const { sender, l1BaseFee, messageData } = l1ToL2Message;
    const {
      destAddress,
      l2CallValue,
      l1Value,
      maxSubmissionFee,
      excessFeeRefundAddress,
      callValueRefundAddress,
      gasLimit,
      maxFeePerGas,
      data,
    } = messageData;
    return {
      sender,
      l1BaseFee: l1BaseFee.toString(),
      messageData: {
        destAddress,
        l2CallValue: l2CallValue.toString(),
        l1Value: l1Value.toString(),
        maxSubmissionFee: maxSubmissionFee.toString(),
        excessFeeRefundAddress,
        callValueRefundAddress,
        gasLimit: gasLimit.toString(),
        maxFeePerGas: maxFeePerGas.toString(),
        data,
      },
    };
  }

  return {
    sender: null,
    l1BaseFee: null,
    messageData: null,
  };
};

async function getData({
  retryables: l1ToL2Messages,
  retryablesClassic: l1ToL2MessagesClassic,
  deposits,
}: L1ToL2MessagesAndDepositMessages) {
  const l1ToL2MessagesPromises = l1ToL2Messages.map((l1ToL2Message) =>
    l1ToL2MessageToStatusDisplay(l1ToL2Message, false),
  );
  const l1ToL2MessagesClassicPromises = l1ToL2MessagesClassic.map(
    (l1ToL2Message) => l1ToL2MessageToStatusDisplay(l1ToL2Message, true),
  );
  const depositsPromises = deposits.map((deposit) =>
    depositMessageStatusDisplay(deposit),
  );

  const messagesDisplays = await Promise.all([
    ...l1ToL2MessagesPromises,
    ...l1ToL2MessagesClassicPromises,
    ...depositsPromises,
  ]);

  return { messagesDisplays };
}

type Props = {
  messages: L1ToL2MessagesAndDepositMessages;
  hasL2ToL1MessagesConfirmed: boolean;
};

const ConnectButtons = dynamic(
  () => import('../../../components/ConnectButtons'),
  {
    ssr: false,
  },
);
const Redeem = dynamic(() => import('../../../components/Redeem'), {
  ssr: false,
});

const MessageDisplays = async ({
  messages,
  hasL2ToL1MessagesConfirmed,
}: Props) => {
  const { messagesDisplays } = await getData(messages);
  const showConnectButtons =
    messagesDisplays.some((msg) => msg.showRedeemButton) ||
    hasL2ToL1MessagesConfirmed;

  return (
    <>
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
                    l1ToL2Message={{
                      chainID: messageDisplay.l2Network.chainID,
                      networkName: messageDisplay.l2Network.name,
                      messageNumber:
                        messageDisplay.l1ToL2Message?.messageNumber?.toString(),
                      ...getDataFromL1ToL2Message(messageDisplay.l1ToL2Message),
                    }}
                  />
                )}
              </>
            }
          </div>
        );
      })}
      {showConnectButtons && <ConnectButtons />}
    </>
  );
};

export { MessageDisplays };
