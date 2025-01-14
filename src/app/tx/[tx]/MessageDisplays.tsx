import dynamic from 'next/dynamic';
import { ExternalLink } from '@/components/ExternalLink';
import {
  depositMessageStatusDisplay,
  getRetryableIdOrDepositHash,
  parentToChildMessageToStatusDisplay,
} from '@/utils';
import {
  MessageStatusDisplay,
  ParentToChildMessagesAndDepositMessages,
} from '@/types';
import { getExplorer } from '@/utils/getExplorer';

const getDataFromParentToChildMessage = (
  parentToChildMessage: MessageStatusDisplay['parentToChildMessage'],
) => {
  if (parentToChildMessage && 'sender' in parentToChildMessage) {
    const { sender, parentBaseFee, messageData } = parentToChildMessage;
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
      parentBaseFee: parentBaseFee.toString(),
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
    parentBaseFee: null,
    messageData: null,
  };
};

async function getData({
  retryables: parentToChildMessages,
  retryablesClassic: parentToChildMessagesClassic,
  deposits,
}: ParentToChildMessagesAndDepositMessages): Promise<{
  messagesDisplays: MessageStatusDisplay[];
}> {
  const parentToChildMessagesPromises = [
    ...parentToChildMessages,
    ...parentToChildMessagesClassic,
  ].map((parentToChildMessage) =>
    parentToChildMessageToStatusDisplay(parentToChildMessage),
  );
  const depositsPromises = deposits.map((deposit) =>
    depositMessageStatusDisplay(deposit),
  );

  const messagesDisplays: MessageStatusDisplay[] = await Promise.all([
    ...parentToChildMessagesPromises,
    ...depositsPromises,
  ]);

  return { messagesDisplays };
}

type Props = {
  messages: ParentToChildMessagesAndDepositMessages;
  hasChildToParentMessagesConfirmed: boolean;
};

const ConnectButton = dynamic(
  () => import('../../../components/ConnectButton'),
  {
    ssr: false,
  },
);
const Redeem = dynamic(() => import('../../../components/Redeem'), {
  ssr: false,
});

const MessageDisplays = async ({
  messages,
  hasChildToParentMessagesConfirmed: hasChildToParentMessagesConfirmed,
}: Props) => {
  const { messagesDisplays } = await getData(messages);
  const showConnectButton =
    messagesDisplays.some((msg) => msg.showRedeemButton) ||
    hasChildToParentMessagesConfirmed;

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
                  {messageDisplay.childTxHash !== 'null' ? (
                    <ExternalLink
                      href={`${messageDisplay.explorerUrl}/tx/${messageDisplay.childTxHash}`}
                    >
                      Transaction
                    </ExternalLink>
                  ) : (
                    'Transaction'
                  )}{' '}
                  status on {messageDisplay.childNetwork.name}
                </h3>

                {messageDisplay.parentToChildMessage !== undefined && (
                  <ExternalLink
                    href={`${
                      messageDisplay.explorerUrl
                    }/tx/${getRetryableIdOrDepositHash(messageDisplay)}`}
                    showIcon
                  >
                    Check Your Retryable Ticket on{' '}
                    {messageDisplay.childNetwork.name}
                  </ExternalLink>
                )}

                {messageDisplay.autoRedeemHash !== undefined && (
                  <p>
                    <ExternalLink
                      href={`${getExplorer(
                        messageDisplay.childNetwork.chainId,
                      )}/tx/${messageDisplay.autoRedeemHash}`}
                      showIcon
                    >
                      Check Your AutoRedeem transaction on{' '}
                      {messageDisplay.childNetwork.name}
                    </ExternalLink>
                  </p>
                )}

                <p>{messageDisplay.text}</p>
                {messageDisplay.showRedeemButton && (
                  <Redeem
                    parentToChildMessage={{
                      chainId: messageDisplay.childNetwork.chainId,
                      networkName: messageDisplay.childNetwork.name,
                      messageNumber:
                        messageDisplay.parentToChildMessage?.messageNumber?.toString(),
                      ...getDataFromParentToChildMessage(
                        messageDisplay.parentToChildMessage,
                      ),
                    }}
                  />
                )}
              </>
            }
          </div>
        );
      })}
      {showConnectButton && <ConnectButton />}
    </>
  );
};

export { MessageDisplays };
