import { useMemo } from "react";
import { L1ToL2MessageStatusDisplay } from "./App";
import { JsonRpcSigner } from "@ethersproject/providers";
import { L1ToL2MessageWriter } from "@arbitrum/sdk";

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
          // NOTE: we could have a "reader to writer" method in migration sdk
          //       but we don't have it and therefore the below mess
          const _l1ToL2Message = l1ToL2Message.l1ToL2Message as any
          const isNitro = _l1ToL2Message.nitroReader !== undefined
          const innerReader = isNitro ? _l1ToL2Message.nitroReader : _l1ToL2Message.classicReader
          const l1ToL2MessageWriter = new L1ToL2MessageWriter(
            signer,
            l1ToL2Message.l2Network.chainID,
            innerReader.sender,
            innerReader.messageNumber,
            innerReader.l1BaseFee,
            innerReader.messageData,
            isNitro ? undefined : innerReader.retryableCreationId
          );
          try {
            const res = await l1ToL2MessageWriter.redeem();
            const rec = await res.wait();
            if (rec.status === 1) {
              alert(`Retryable successfully redeemed! ${rec.transactionHash}`);
              // Reload the page to show the new status
              window.location.reload();
            } else {
              throw new Error("Failed to redeem");
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
