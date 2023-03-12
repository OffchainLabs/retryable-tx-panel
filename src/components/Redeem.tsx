'use client';
import { useMemo } from 'react';
import { MessageStatusDisplay } from '../types';
import { L1ToL2MessageWriter } from '@arbitrum/sdk';
import React from 'react';
import { useNetwork, useSigner } from 'wagmi';
import { WagmiProvider } from './WagmiProvider';

type Props = {
  l1ToL2Message: MessageStatusDisplay;
};

function RedeemInner({ l1ToL2Message }: Props) {
  const [message, setMessage] = React.useState<string>('');
  const { chain } = useNetwork();
  const { data: signer = null } = useSigner({ chainId: chain?.id });

  const redeemButton = useMemo(() => {
    if (!signer) return null;

    if (chain?.id !== l1ToL2Message.l2Network.chainID) {
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
  }, [chain?.id, l1ToL2Message, signer]);

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

function Redeem({ l1ToL2Message }: Props) {
  return (
    <WagmiProvider>
      <RedeemInner l1ToL2Message={l1ToL2Message} />
    </WagmiProvider>
  );
}

export { Redeem };
