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
  42161: `https://arb1.arbitrum.io/rpc`,
  421613: `https://goerli-rollup.arbitrum.io/rpc`,
  42170: `https://nova.arbitrum.io/rpc`
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
  confirmationInfo: {
    deadlineBlock: BigNumber;
    etaSeconds: number;
  } | null;
  l1Network: L1Network;
  l2Network: L2Network;
  l2Provider: JsonRpcProvider;
  createdAtL2BlockNumber: number;
}

export const getL2ToL1Messages = async (
  txHash: string
): Promise<L2ToL1MessageSearchResult> => {
  for (let [chainID, rpcURL] of Object.entries(supportedL2Networks)) {
    const l2Network = await getL2Network(+chainID);
    const l2Provider = await new JsonRpcProvider(rpcURL);

    // TODO
    const l1ChainID = l2Network.partnerChainID as 1 | 5;
    const l1Network = await getL1Network(l1ChainID);
    const l1Provider = await new JsonRpcProvider(
      supportedL1Networks[l1ChainID]
    );
    const currentL1Block = BigNumber.from(await l1Provider.getBlockNumber());
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
      const l2ToL1Messages = await l2Receipt.getL2ToL1Messages(l1Provider);
      const l2MessagesData: L2ToL1MessageData[] = [];
      for (let l2ToL1Message of l2ToL1Messages) {
        try {
          const status = await l2ToL1Message.status(l2Provider);
          const deadlineBlock =
            status !== L2ToL1MessageStatus.CONFIRMED &&
            status !== L2ToL1MessageStatus.EXECUTED
              ? await l2ToL1Message.getFirstExecutableBlock(l2Provider)
              : null;

          l2MessagesData.push({
            status,
            l2ToL1Message,
            confirmationInfo: deadlineBlock
              ? {
                  deadlineBlock,
                  etaSeconds: deadlineBlock
                    .sub(currentL1Block)
                    .mul(15)
                    .toNumber()
                }
              : null,
            l1Network,
            l2Network,
            l2Provider,
            createdAtL2BlockNumber: l2Receipt.blockNumber
          });
        } catch (e) {
          const expectedError = "batch doesn't exist";
          const err = e as Error & { error: Error };
          const actualError =
            err && (err.message || (err.error && err.error.message));
          if (actualError.includes(expectedError)) {
            console.warn("batch doesnt exist");

            l2MessagesData.push({
              status: L2ToL1MessageStatus.UNCONFIRMED,
              l2ToL1Message,
              confirmationInfo: null,
              l1Network,
              l2Network,
              l2Provider,
              createdAtL2BlockNumber: l2Receipt.blockNumber
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
