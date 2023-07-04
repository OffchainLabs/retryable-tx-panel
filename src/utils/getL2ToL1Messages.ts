import { supportedL1Networks, supportedL2Networks } from '@/utils/network';
import {
  L2ToL1MessageData,
  L2ToL1MessageSearchResult,
  L2TxnStatus,
} from '@/types';
import {
  getL1Network,
  getL2Network,
  L2ToL1MessageStatus,
  L2TransactionReceipt,
} from '@arbitrum/sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';

export const getL2ToL1Messages = async (
  txHash: string,
): Promise<L2ToL1MessageSearchResult> => {
  return new Promise(async (resolve) => {
    const messagesPromises = Object.entries(supportedL2Networks).map(
      async ([chainID, rpcURL]) => {
        const l2Network = await getL2Network(+chainID);
        const l2Provider = new JsonRpcProvider(rpcURL);

        // TODO
        const l1ChainID = l2Network.partnerChainID as 1 | 5;
        const l1Provider = new JsonRpcProvider(supportedL1Networks[l1ChainID]);
        const [l1Network, l1BlogNumber, receipt] = await Promise.all([
          getL1Network(l1ChainID),
          l1Provider.getBlockNumber(),
          l2Provider.getTransactionReceipt(txHash),
        ]);
        const currentL1Block = BigNumber.from(l1BlogNumber);
        if (!receipt) {
          return null;
        }
        if (receipt.status === 0) {
          // l1 tx failed, terminal
          resolve({
            l2TxnStatus: L2TxnStatus.FAILURE,
            l2ToL1Messages: [],
            l2TxHash: txHash,
          });
        }

        const l2Receipt = new L2TransactionReceipt(receipt);
        const l2ToL1Messages = await l2Receipt.getL2ToL1Messages(l1Provider);
        const l2MessagesData: Promise<L2ToL1MessageData>[] = l2ToL1Messages.map(
          async (l2ToL1Message) => {
            try {
              const status = await l2ToL1Message.status(l2Provider);
              const deadlineBlock =
                status !== L2ToL1MessageStatus.CONFIRMED &&
                status !== L2ToL1MessageStatus.EXECUTED
                  ? await l2ToL1Message.getFirstExecutableBlock(l2Provider)
                  : null;
              return {
                status,
                l2ToL1Message,
                confirmationInfo: deadlineBlock
                  ? {
                      deadlineBlock,
                      etaSeconds: deadlineBlock
                        .sub(currentL1Block)
                        .mul(15)
                        .toNumber(),
                    }
                  : null,
                l1Network,
                l2Network,
                l2Provider,
                createdAtL2BlockNumber: l2Receipt.blockNumber,
              };
            } catch (e) {
              const expectedError = "batch doesn't exist";
              const err = e as Error & { error: Error };
              const actualError =
                err && (err.message || (err.error && err.error.message));
              if (actualError.includes(expectedError)) {
                console.warn('batch doesnt exist');

                return {
                  status: L2ToL1MessageStatus.UNCONFIRMED,
                  l2ToL1Message,
                  confirmationInfo: null,
                  l1Network,
                  l2Network,
                  l2Provider,
                  createdAtL2BlockNumber: l2Receipt.blockNumber,
                };
              } else {
                throw e;
              }
            }
          },
        );

        return await Promise.all(l2MessagesData);
      },
    );

    const data = await Promise.all(messagesPromises);
    const messages = data
      .flatMap((d) => d)
      .filter((d) => d) as L2ToL1MessageData[];

    if (messages.length) {
      resolve({
        l2TxnStatus: L2TxnStatus.SUCCESS,
        l2ToL1Messages: messages,
        l2TxHash: txHash,
      });
    } else {
      resolve({
        l2TxnStatus: L2TxnStatus.NOT_FOUND,
        l2ToL1Messages: [],
        l2TxHash: txHash,
      });
    }
  });
};
