'use client';
import { useState } from 'react';
import { ChainId, supportedL2Networks } from '@/utils/network';
import { ChildToParentMessageData } from '@/types';
import {
  ChildToParentMessageStatus,
  ChildToParentMessage,
  ChildToParentMessageWriter,
} from '@arbitrum/sdk';
import { useNetwork, useSigner } from 'wagmi';
import { JsonRpcProvider } from '@ethersproject/providers';

const etaDisplay = (etaSeconds: number) => {
  const minutesLeft = Math.round(etaSeconds / 60);
  const hoursLeft = Math.round(minutesLeft / 60);
  const daysLeft = Math.round(hoursLeft / 24);

  if (daysLeft > 0) {
    return `~${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  }

  if (hoursLeft > 0) {
    return `~${hoursLeft} hour${hoursLeft === 1 ? '' : 's'}`;
  }

  if (minutesLeft === 0) {
    return 'less than 1 hour';
  }
};

// messages need to be serialized when passed from server component to client props
export type ChildToParentMessageDataLike = Pick<
  ChildToParentMessageData,
  'status' | 'createdAtChildBlockNumber'
> & {
  parentNetwork: Pick<
    ChildToParentMessageData['parentNetwork'],
    'chainId' | 'name'
  >;
  childNetwork: Pick<
    ChildToParentMessageData['childNetwork'],
    'chainId' | 'name'
  >;
  confirmationInfo: {
    deadlineBlock: string;
    etaSeconds: number;
  } | null;
  childToParentEventIndex: number;
};
type Props = {
  childToParentMessages: ChildToParentMessageDataLike[];
};

function ChildToParentMsgsDisplay({ childToParentMessages }: Props) {
  const { chain } = useNetwork();
  const { data: signer = null } = useSigner({ chainId: chain?.id });
  const [redeeming, setIsRedeeming] = useState(false);

  const renderMessage = (
    childToParentMessage: ChildToParentMessageDataLike,
  ) => {
    switch (childToParentMessage.status) {
      case ChildToParentMessageStatus.UNCONFIRMED:
        return (
          <div>
            <p>L2 to L1 message not yet confirmed</p>

            {childToParentMessage.confirmationInfo ? (
              <p>
                {' ETA:'}
                {etaDisplay(
                  childToParentMessage.confirmationInfo.etaSeconds,
                )}{' '}
                <br /> (L1 block deadline:{' '}
                {childToParentMessage.confirmationInfo.deadlineBlock})
              </p>
            ) : null}
          </div>
        );
      case ChildToParentMessageStatus.CONFIRMED:
        const childProvider = new JsonRpcProvider(
          supportedL2Networks[
            childToParentMessage.childNetwork.chainId as ChainId
          ],
        );
        return (
          <div>
            <p>L2 to L1 message confirmed, ready to redeem</p>
            {chain?.id !== childToParentMessage.parentNetwork.chainId ? (
              <div>
                {`To redeem, connect to chain ${childToParentMessage.parentNetwork.chainId} (${childToParentMessage.parentNetwork.name})`}
              </div>
            ) : (
              <div className="redeem-button-container">
                <button
                  className="button"
                  disabled={redeeming}
                  onClick={async () => {
                    if (!signer) return;
                    try {
                      setIsRedeeming(true);
                      // This would create a lot of duplicated getLogs call, would be nicer if we can pass the event in but it's not serializable
                      // This also assume the order returned by getChildToParentEvents is always in order
                      const childToParentTxEvents =
                        await ChildToParentMessage.getChildToParentEvents(
                          childProvider,
                          {
                            fromBlock:
                              childToParentMessage.createdAtChildBlockNumber,
                            toBlock:
                              childToParentMessage.createdAtChildBlockNumber +
                              1,
                          },
                        );
                      const childToParentMessageWriter =
                        new ChildToParentMessageWriter(
                          signer,
                          childToParentTxEvents[
                            childToParentMessage.childToParentEventIndex
                          ],
                        );
                      const res = await childToParentMessageWriter.execute(
                        childProvider,
                      );
                      const rec = await res.wait();
                      if (rec.status === 1) {
                        alert(
                          `L2 to L1 message successfully redeemed! ${rec.transactionHash}`,
                        );
                      } else {
                        throw new Error('Failed to redeem');
                      }
                    } catch (e: any) {
                      // Ignore user rejected action
                      if (e?.code !== 4001 && e?.code !== 'ACTION_REJECTED') {
                        throw e;
                      }
                    } finally {
                      setIsRedeeming(false);
                    }
                  }}
                >
                  Redeem
                </button>
              </div>
            )}
          </div>
        );
      case ChildToParentMessageStatus.EXECUTED:
        return <div>Your message has been executed 🎉</div>;
    }
  };

  return (
    <>
      {childToParentMessages.map((childToParentMessage, i) => {
        return (
          <div key={i}>
            <h2>Your transaction status:</h2>
            {renderMessage(childToParentMessage)}
          </div>
        );
      })}
    </>
  );
}

export default ChildToParentMsgsDisplay;
