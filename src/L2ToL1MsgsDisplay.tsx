import { JsonRpcSigner } from "@ethersproject/providers";
import { L2ToL1MessageData } from "./lib";
import {
  L2ToL1MessageStatus,
  L2ToL1MessageWriter,
  L2Network
} from "@arbitrum/sdk";

import { BigNumber } from "ethers";

// TODO: import/export from arbitrim/sdk
export const getOutboxAddr = (network: L2Network, batchNumber: BigNumber) => {
  // find the outbox where the activation batch number of the next outbox
  // is greater than the supplied batch
  const res = Object.entries(network.ethBridge.outboxes)
    .sort((a, b) => {
      if (a[1].lt(b[1])) return -1;
      else if (a[1].eq(b[1])) return 0;
      else return 1;
    })
    .find(
      (_, index, array) =>
        array[index + 1] === undefined || array[index + 1][1].gt(batchNumber)
    );

  if (!res) {
    throw new Error("could not find outbox address");
  }

  return res[0];
};

function L2ToL1MsgsDisplay({
  signer,
  l2ToL1Messages,
  connectedNetworkId
}: {
  l2ToL1Messages: L2ToL1MessageData[];
  signer: JsonRpcSigner | null;
  connectedNetworkId: number | null;
}) {
  const renderMessage = (l2ToL1Message: L2ToL1MessageData) => {
    switch (l2ToL1Message.status) {
      case L2ToL1MessageStatus.NOT_FOUND:
      case L2ToL1MessageStatus.UNCONFIRMED:
        return (
          <div>
            <p>L2 to L1 message not yet confirmed</p>
            <p>
              l1 block deadline{" "}
              {l2ToL1Message.deadlineBlock &&
                l2ToL1Message.deadlineBlock.toNumber()}
            </p>
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
                    const outboxAddr = getOutboxAddr(
                      l2ToL1Message.l2Network,
                      l2ToL1Message.l2ToL1Message.batchNumber
                    );
                    const l2ToL1MessageWriter = new L2ToL1MessageWriter(
                      signer,
                      outboxAddr,
                      l2ToL1Message.l2ToL1Message.batchNumber,
                      l2ToL1Message.l2ToL1Message.indexInBatch
                    );

                    const proofData = await l2ToL1MessageWriter.tryGetProof(
                      l2ToL1Message.l2Provider
                    );
                    if (!proofData) return;
                    const res = await l2ToL1MessageWriter.execute(proofData);
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
