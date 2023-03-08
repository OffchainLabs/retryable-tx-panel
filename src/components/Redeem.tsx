import { useMemo } from 'react';
import { MessageStatusDisplay } from '../types';
import { Signer } from '@ethersproject/abstract-signer';
import { L1ToL2MessageWriter } from '@arbitrum/sdk';
import React from 'react';

function Redeem({
  l1ToL2Message,
  signer,
  connectedNetworkId,
}: {
  l1ToL2Message: MessageStatusDisplay;
  signer: Signer | null;
  connectedNetworkId?: number;
}) {
  const [message, setMessage] = React.useState<string>('');

  const redeemButton = useMemo(() => {
    if (!signer) return null;

    if (connectedNetworkId !== l1ToL2Message.l2Network.chainID) {
      return `To redeem, connect to chain ${l1ToL2Message.l2Network.chainID} (${l1ToL2Message.l2Network.name})`;
    }
    return (
      <button
        onClick={async () => {
          // NOTE: we could have a "reader to writer" method in migration sdk
          //       but we don't have it and therefore the below mess
          if (!l1ToL2Message.l1ToL2Message) {
            return;
          }

          // @ts-ignore it works
          const { sender, messageNumber, l1BaseFee, messageData } =
            l1ToL2Message.l1ToL2Message;

          const l1ToL2MessageWriter = new L1ToL2MessageWriter(
            signer,
            l1ToL2Message.l2Network.chainID,
            sender,
            messageNumber,
            l1BaseFee,
            messageData,
          );

          try {
            const res = await l1ToL2MessageWriter.redeem();
            const rec = await res.wait();
            if (rec.status === 1) {
              setMessage(
                `Retryable successfully redeemed! ${rec.transactionHash}`,
              );
              // Reload the page to show the new status
              window.location.reload();
            } else {
              setMessage(res.toString());
              throw new Error('Failed to redeem');
            }
          } catch (err: unknown) {
            setMessage((err as Error).message.toString());
          }
        }}
      >
        redeem
      </button>
    );
  }, [connectedNetworkId, l1ToL2Message, signer]);

  return (
    <>
      {redeemButton}
      <div>
        {message && (
          <textarea readOnly className="redeemtext" value={message} />
        )}
      </div>
    </>
  );
}

export { Redeem };
