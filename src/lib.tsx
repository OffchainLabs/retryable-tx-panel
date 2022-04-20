import { JsonRpcProvider } from "@ethersproject/providers";
import {
  L2ToL1Message,
  L2TransactionReceipt,
  getL2Network,
  getL1Network,
  L2ToL1MessageStatus,
  L1Network,
  L2Network
} from "@arbitrum/sdk";
import { BigNumber } from "@ethersproject/bignumber";
import { supportedL1Networks } from "./App";

const supportedL2Networks = {
  421611: `https://rinkeby.arbitrum.io/rpc`,
  42161: `https://arb1.arbitrum.io/rpc`
};

export enum L2TxnStatus {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  NOT_FOUND = "NOT_FOUND"
}
interface L2ToL1MessageSearchResult {
  l2TxnStatus: L2TxnStatus;
  l2ToL1Messages: L2ToL1MessageData[];
  l2TxHash: string;
}

export interface L2ToL1MessageData {
  status: L2ToL1MessageStatus;
  l2ToL1Message: L2ToL1Message;
  deadlineBlock: BigNumber | null;
  l1Network: L1Network;
  l2Network: L2Network;
  l2Provider: JsonRpcProvider
}

export const getL2ToL1Messages = async (
  txHash: string
): Promise<L2ToL1MessageSearchResult> => {
  for (let [chainID, rpcURL] of Object.entries(supportedL2Networks)) {
    const l2Network = await getL2Network(+chainID);
    const l2Provider = await new JsonRpcProvider(rpcURL);

    // TODO
    const l1ChainID = l2Network.partnerChainID as 1 | 4;
    const l1Network = await getL1Network(l1ChainID);

    const l1Provider = await new JsonRpcProvider(
      supportedL1Networks[l1ChainID]
    );

    const receipt = await l2Provider.getTransactionReceipt(txHash);
    if (receipt) {
      if (receipt.status === 0) {
        // l1 tx failed, terminal
        return {
          l2TxnStatus: L2TxnStatus.FAILURE,
          l2ToL1Messages: [],
          l2TxHash: txHash
        };
      }
      const l2Receipt = new L2TransactionReceipt(receipt);
      const l2ToL1Messages = await l2Receipt.getL2ToL1Messages(
        l1Provider,
        l2Network
      );

      const l2MessagesData: L2ToL1MessageData[] = [];
      for (let l2ToL1Message of l2ToL1Messages) {
        try {
          const proofData = await l2ToL1Message.tryGetProof(l2Provider);
          const status = await l2ToL1Message.status(proofData);
          const deadlineBlock =
            status !== L2ToL1MessageStatus.CONFIRMED &&
            status !== L2ToL1MessageStatus.EXECUTED
              ? null
              : await l2ToL1Message.getFirstExecutableBlock(l2Provider);
          l2MessagesData.push({
            status,
            l2ToL1Message,
            deadlineBlock,
            l1Network,
            l2Network,
            l2Provider
          });
        } catch (e) {
          const expectedError = "batch doesn't exist";
          const err = e as Error & { error: Error };
          const actualError =
            err && (err.message || (err.error && err.error.message));
          if (actualError.includes(expectedError)) {
            l2MessagesData.push({
              status: L2ToL1MessageStatus.NOT_FOUND,
              l2ToL1Message,
              deadlineBlock: null,
              l1Network,
              l2Network,
              l2Provider
            });
          } else {
            throw e;
          }
        }
      }
      return {
        l2TxnStatus: L2TxnStatus.SUCCESS,
        l2ToL1Messages: l2MessagesData,
        l2TxHash: txHash
      };
    }
  }
  return {
    l2TxnStatus: L2TxnStatus.NOT_FOUND,
    l2ToL1Messages: [],
    l2TxHash: txHash
  };
};
