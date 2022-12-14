import { Signer } from "@ethersproject/abstract-signer";
import { L2ToL1MessageData } from "./lib";
import {
  L2ToL1MessageStatus,
  L2ToL1MessageWriter,
  L2ToL1Message
} from "@arbitrum/sdk";

const etaDisplay = (etaSeconds: number) => {
  const minutesLeft = Math.round(etaSeconds / 60);
  const hoursLeft = Math.round(minutesLeft / 60);
  const daysLeft = Math.round(hoursLeft / 24);

  if (daysLeft > 0) {
    return `~${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
  }

  if (hoursLeft > 0) {
    return `~${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}`;
  }

  if (minutesLeft === 0) {
    return "less than 1 hour";
  }
};
function L2ToL1MsgsDisplay({
  signer,
  l2ToL1Messages,
  connectedNetworkId
}: {
  l2ToL1Messages: L2ToL1MessageData[];
  signer: Signer | null;
  connectedNetworkId?: number;
}) {
  const renderMessage = (l2ToL1Message: L2ToL1MessageData) => {
    switch (l2ToL1Message.status) {
      case L2ToL1MessageStatus.UNCONFIRMED:
        return (
          <div>
            <p>L2 to L1 message not yet confirmed</p>

            {l2ToL1Message.confirmationInfo ? (
              <p>
                {" ETA:"}
                {etaDisplay(
                  l2ToL1Message.confirmationInfo.etaSeconds
                )} <br /> (L1 block deadline:{" "}
                {l2ToL1Message.confirmationInfo.deadlineBlock.toNumber()})
              </p>
            ) : null}
          </div>
        );
      case L2ToL1MessageStatus.CONFIRMED:
        return (
          <div>
            <p>L2 to L1 message confirmed, ready to redeem</p>
            {connectedNetworkId !== l2ToL1Message.l1Network.chainID ? (
              <div>
                {`To redeem, connect to chain ${l2ToL1Message.l1Network.chainID} (${l2ToL1Message.l1Network.name})`}
              </div>
            ) : (
              <div>
                <button
                  onClick={async () => {
                    if (!signer) return;
                    const [l2ToL1TxEvent] = await L2ToL1Message.getL2ToL1Events(
                      l2ToL1Message.l2Provider,
                      {
                        fromBlock: l2ToL1Message.createdAtL2BlockNumber,
                        toBlock: l2ToL1Message.createdAtL2BlockNumber + 1
                      }
                    );
                    const l2ToL1MessageWriter = new L2ToL1MessageWriter(
                      signer,
                      l2ToL1TxEvent
                    );

                    const res = await l2ToL1MessageWriter.execute(
                      l2ToL1Message.l2Provider
                    );
                    const rec = await res.wait();
                    if (rec.status === 1) {
                      alert(
                        `L2toL1 message successfully redeemed! ${rec.transactionHash}`
                      );
                    } else {
                      throw new Error("Failed to redeem");
                    }
                  }}
                >
                  Redeem
                </button>
              </div>
            )}
          </div>
        );
      case L2ToL1MessageStatus.EXECUTED:
        return <div>Your message has been executed 🎉</div>;
    }
  };
  return (
    <>
      {l2ToL1Messages.map((l2ToL1Message, i) => {
        return (
          <div key={i}>
            <h2>Your transaction status:</h2>
            {renderMessage(l2ToL1Message)}
          </div>
        );
      })}
    </>
  );
}

export default L2ToL1MsgsDisplay;
