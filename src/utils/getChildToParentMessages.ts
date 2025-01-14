import {
  ChainId,
  mapChainIdToName,
  supportedL1Networks,
  supportedL2Networks,
} from '@/utils/network';
import {
  ChildToParentMessageSearchResult,
  ChildTxnStatus,
  ChildToParentMessageData,
} from '@/types';
import {
  ChildToParentMessageReader,
  ChildToParentMessageStatus,
  ChildTransactionReceipt,
  getArbitrumNetwork,
} from '@arbitrum/sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import { getTransactionReceipt } from '@arbitrum/sdk/dist/lib/utils/lib';

export const getChildToParentMessages = async (
  txHash: string,
): Promise<ChildToParentMessageSearchResult> => {
  return new Promise(async (resolve) => {
    const messagesPromises = Object.entries(supportedL2Networks).map(
      async ([chainID, rpcURL]) => {
        const childNetwork = getArbitrumNetwork(+chainID);
        const childProvider = new JsonRpcProvider(rpcURL);

        const parentChainID = childNetwork.parentChainId as
          | ChainId.Mainnet
          | ChainId.Sepolia;
        const parentProvider = new JsonRpcProvider(
          supportedL1Networks[parentChainID],
        );
        try {
          await parentProvider.getBlockNumber();
        } catch (e) {
          console.warn(supportedL1Networks[parentChainID], 'not working');
          return null;
        }
        const [parentBlockNumber, receipt] = await Promise.all([
          parentProvider.getBlockNumber(),
          getTransactionReceipt(childProvider, txHash),
        ]);
        const currentL1Block = BigNumber.from(parentBlockNumber);
        if (!receipt) {
          return null;
        }
        if (receipt.status === 0) {
          // parent tx failed, terminal
          resolve({
            childTxnStatus: ChildTxnStatus.FAILURE,
            childToParentMessages: [],
            childTxHash: txHash,
          });
        }

        const childReceipt = new ChildTransactionReceipt(receipt);
        const childToParentEvents = childReceipt.getChildToParentEvents();
        const childMessagesData: Promise<ChildToParentMessageData>[] =
          childToParentEvents.map(
            async (childToParentEvent, childToParentEventIndex) => {
              const childToParentMessage = new ChildToParentMessageReader(
                parentProvider,
                childToParentEvent,
              );
              try {
                const status = await childToParentMessage.status(childProvider);
                const deadlineBlock =
                  status !== ChildToParentMessageStatus.CONFIRMED &&
                  status !== ChildToParentMessageStatus.EXECUTED
                    ? await childToParentMessage.getFirstExecutableBlock(
                        childProvider,
                      )
                    : null;
                return {
                  status,
                  childToParentMessage,
                  confirmationInfo: deadlineBlock
                    ? {
                        deadlineBlock,
                        etaSeconds: deadlineBlock
                          .sub(currentL1Block)
                          .mul(12)
                          .toNumber(),
                      }
                    : null,
                  parentNetwork: {
                    chainId: parentChainID,
                    name: mapChainIdToName[parentChainID],
                  },
                  childNetwork,
                  childProvider,
                  createdAtChildBlockNumber: childReceipt.blockNumber,
                  childToParentEventIndex,
                };
              } catch (e) {
                const expectedError = "batch doesn't exist";
                const err = e as Error & { error: Error };
                const actualError =
                  err && (err.message || (err.error && err.error.message));
                if (actualError.includes(expectedError)) {
                  console.warn('batch doesnt exist');

                  return {
                    status: ChildToParentMessageStatus.UNCONFIRMED,
                    childToParentMessage,
                    confirmationInfo: null,
                    parentNetwork: {
                      chainId: parentChainID,
                      name: mapChainIdToName[parentChainID],
                    },
                    childNetwork,
                    childProvider,
                    createdAtChildBlockNumber: childReceipt.blockNumber,
                    childToParentEventIndex,
                  };
                } else {
                  throw e;
                }
              }
            },
          );

        return await Promise.all(childMessagesData);
      },
    );

    const data = await Promise.all(messagesPromises);
    const messages = data
      .flatMap((d) => d)
      .filter((d) => d) as ChildToParentMessageData[];

    if (messages.length) {
      resolve({
        childTxnStatus: ChildTxnStatus.SUCCESS,
        childToParentMessages: messages,
        childTxHash: txHash,
      });
    } else {
      resolve({
        childTxnStatus: ChildTxnStatus.NOT_FOUND,
        childToParentMessages: [],
        childTxHash: txHash,
      });
    }
  });
};
