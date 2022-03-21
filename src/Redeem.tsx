import React, { useMemo } from "react";
import { L1ToL2MessageStatusDisplay } from "./App";
import { JsonRpcSigner } from "@ethersproject/providers";
import { L1ToL2MessageWriter } from "arb-ts";

function Redeem({
  l1ToL2Message,
  signer,
  connectedNetworkId
}: {
  l1ToL2Message: L1ToL2MessageStatusDisplay;
  signer: JsonRpcSigner | null;
  connectedNetworkId: number | null;
}) {
  const redeemButton = useMemo(() => {
    if (!signer) return "connect signer to redeem";
    if (connectedNetworkId !== l1ToL2Message.l2Network.chainID) {
      return `To redeem, connect to chain ${l1ToL2Message.l2Network.chainID} (${l1ToL2Message.l2Network.name})`;
    }
    return (
      <button
        onClick={async () => {
          // NOTE: we could but a "reader to writer" method in arb-ts
          const l1ToL2MessageWriter = new L1ToL2MessageWriter(
            signer,
            l1ToL2Message.l1ToL2Message.retryableCreationId,
            l1ToL2Message.l1ToL2Message.messageNumber
          );
          try {
            const res = await l1ToL2MessageWriter.redeem();
            const rec = await res.wait();
            if (rec.status === 1) {
              alert(`Retryable successfully redeemed! ${rec.transactionHash}`);
            } else {
              throw new Error("Failed to redeed");
            }
          } catch (err) {
            alert("Failed to redeem retryable:");
          }
        }}
      >
        redeem
      </button>
    );
  }, [connectedNetworkId, l1ToL2Message, signer]);

  return <div>{redeemButton}</div>;
}

export default Redeem;
