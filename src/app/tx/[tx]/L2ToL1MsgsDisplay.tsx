'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChainId, supportedL2Networks } from '@/utils/network';
import { L2ToL1MessageData } from '@/types';
import {
  L2ToL1MessageStatus,
  L2ToL1MessageWriter,
  L2ToL1Message,
} from '@arbitrum/sdk';
import { useNetwork, useSigner } from 'wagmi';
import { JsonRpcProvider } from '@ethersproject/providers';
import { L2ToL1TransactionEvent } from '@arbitrum/sdk/dist/lib/message/L2ToL1Message';

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
export type L2ToL1MessageDataLike = Pick<
  L2ToL1MessageData,
  'status' | 'createdAtL2BlockNumber'
> & {
  l1Network: Pick<L2ToL1MessageData['l1Network'], 'chainID' | 'name'>;
  l2Network: Pick<L2ToL1MessageData['l2Network'], 'chainID' | 'name'>;
  confirmationInfo: {
    deadlineBlock: string;
    etaSeconds: number;
  } | null;
};
type Props = {
  l2ToL1Messages: L2ToL1MessageDataLike[];
};

type L2ToL1TransactionEventWithTransactionHash = L2ToL1TransactionEvent & {
  transactionHash: string;
};

function ConfirmedMessageDisplay({
  l2ToL1Message,
}: {
  l2ToL1Message: L2ToL1MessageDataLike;
}) {
  const { chain } = useNetwork();
  const { data: signer = null } = useSigner({ chainId: chain?.id });
  const [isRedeeming, setIsRedeeming] = useState(false);
  const l2Provider = new JsonRpcProvider(
    supportedL2Networks[l2ToL1Message.l2Network.chainID as ChainId],
  );
  return (
    <div>
      <p>L2 to L1 message confirmed, ready to redeem</p>
      {chain?.id !== l2ToL1Message.l1Network.chainID ? (
        <div>
          {`To redeem, connect to chain ${l2ToL1Message.l1Network.chainID} (${l2ToL1Message.l1Network.name})`}
        </div>
      ) : (
        <div className="redeem-button-container">
          <button
            disabled={isRedeeming}
            onClick={async () => {
              try {
                if (!signer) return;
                setIsRedeeming(true);
                const l2ToL1TxEvents = await L2ToL1Message.getL2ToL1Events(
                  l2Provider,
                  {
                    fromBlock: l2ToL1Message.createdAtL2BlockNumber,
                    toBlock: l2ToL1Message.createdAtL2BlockNumber + 1,
                  },
                );
                const l2ToL1MessageWriter = new L2ToL1MessageWriter(
                  signer,
                  l2ToL1TxEvents[l2ToL1TxEvents.length - 1],
                );
                const res = await l2ToL1MessageWriter.execute(l2Provider);
                console.log('ucu');
                const rec = await res.wait();
                if (rec.status === 1) {
                  alert(
                    `L2toL1 message successfully redeemed! ${rec.transactionHash}`,
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
}

function UnconfirmedMessageDisplay({
  confirmationInfo,
}: {
  confirmationInfo: L2ToL1MessageDataLike['confirmationInfo'];
}) {
  return (
    <div>
      <p>L2 to L1 message not yet confirmed</p>

      {confirmationInfo ? (
        <p>
          {' ETA:'}
          {etaDisplay(confirmationInfo.etaSeconds)} <br /> (L1 block deadline:{' '}
          {confirmationInfo.deadlineBlock})
        </p>
      ) : null}
    </div>
  );
}

function L2ToL1MessageDisplay({
  l2ToL1Message,
}: {
  l2ToL1Message: L2ToL1MessageDataLike;
}) {
  const [events, setEvents] = useState<
    L2ToL1TransactionEventWithTransactionHash[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const l2Provider = useMemo(
    () =>
      new JsonRpcProvider(
        supportedL2Networks[l2ToL1Message.l2Network.chainID as ChainId],
      ),
    [l2ToL1Message.l2Network.chainID],
  );

  useEffect(() => {
    async function getEvents() {
      setIsLoading(true);
      const l2ToL1TxEvents = await L2ToL1Message.getL2ToL1Events(l2Provider, {
        fromBlock: l2ToL1Message.createdAtL2BlockNumber,
        toBlock: l2ToL1Message.createdAtL2BlockNumber + 1,
      });
      console.log('getEvents', l2ToL1TxEvents);
      setEvents(l2ToL1TxEvents);
      setIsLoading(false);
    }

    getEvents();
  }, [l2Provider, l2ToL1Message]);

  if (isLoading) {
    return null;
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <>
      <h2>Your transaction status:</h2>
      {events.map((event, i) => {
        if (l2ToL1Message.status === L2ToL1MessageStatus.UNCONFIRMED) {
          return (
            <UnconfirmedMessageDisplay
              confirmationInfo={l2ToL1Message.confirmationInfo}
              key={i}
            />
          );
        }
        if (l2ToL1Message.status === L2ToL1MessageStatus.CONFIRMED) {
          console.log(l2ToL1Message, event);
          return (
            <ConfirmedMessageDisplay l2ToL1Message={l2ToL1Message} key={i} />
          );
        }
        return <div key={i}>Your message has been executed 🎉</div>;
      })}
    </>
  );
}

function L2ToL1MsgsDisplay({ l2ToL1Messages }: Props) {
  return (
    <>
      {l2ToL1Messages.map((l2ToL1Message, i) => {
        return (
          <div key={i}>
            <L2ToL1MessageDisplay l2ToL1Message={l2ToL1Message} />
          </div>
        );
      })}
    </>
  );
}

export default L2ToL1MsgsDisplay;
