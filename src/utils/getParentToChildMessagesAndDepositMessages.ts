import {
  EthDepositMessageWithNetwork,
  ParentToChildMessagesAndDepositMessages,
} from '@/types';
import {
  getArbitrumNetwork,
  ArbitrumNetwork,
  ParentTransactionReceipt,
  getChildrenForNetwork,
  ParentToChildMessageReaderClassic,
  ParentToChildMessageReader,
} from '@arbitrum/sdk';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { ChainId, rpcURLs } from './network';

type Messages = {
  allParentToChildMessages: (ParentToChildMessageReader & {
    childNetwork: ArbitrumNetwork;
  })[];
  allParentToChildMessagesClassic: (ParentToChildMessageReaderClassic & {
    childNetwork: ArbitrumNetwork;
  })[];
  allDepositMessages: EthDepositMessageWithNetwork[];
};

export const getParentToChildMessagesAndDepositMessages = async (
  parentTxnReceipt: ParentTransactionReceipt,
  parentNetwork: ChainId,
): Promise<ParentToChildMessagesAndDepositMessages> => {
  console.log(
    parentNetwork,
    getChildrenForNetwork(parentNetwork).map((a) => a.chainId),
  );
  const messagesPromises: Promise<Messages>[] = Array.from(
    getChildrenForNetwork(parentNetwork),
  ).map(async (childChain) => {
    // TODO: error handle
    const childNetwork = getArbitrumNetwork(childChain.chainId);

    // Check if any parent to child msg is sent to the inbox of this childNetwork
    const logFromChildInbox = parentTxnReceipt.logs.filter((log) => {
      return (
        log.address.toLowerCase() === childNetwork.ethBridge.inbox.toLowerCase()
      );
    });
    if (logFromChildInbox.length === 0) {
      return {
        allParentToChildMessages: [],
        allParentToChildMessagesClassic: [],
        allDepositMessages: [],
      };
    }

    const childRpcURL = rpcURLs[childChain.chainId as ChainId];
    if (!childRpcURL) {
      throw new Error(
        'Unknown L2 chain id. This chain is not supported by dashboard',
      );
    }

    const childProvider = new StaticJsonRpcProvider(childRpcURL);
    const isClassic = await parentTxnReceipt.isClassic(childProvider);

    if (isClassic) {
      const messages = (
        await parentTxnReceipt.getParentToChildMessagesClassic(childProvider)
      ).map((parentToChildMessage) => {
        return Object.assign(parentToChildMessage, { childNetwork });
      });
      return {
        allParentToChildMessages: [],
        allParentToChildMessagesClassic: messages,
        allDepositMessages: [],
      };
    } else {
      const messages = (
        await parentTxnReceipt.getParentToChildMessages(childProvider)
      ).map((parentToChildMessage) => {
        return Object.assign(parentToChildMessage, { childNetwork });
      });

      const depositMessagesWithNetwork: EthDepositMessageWithNetwork[] = (
        await parentTxnReceipt.getEthDeposits(childProvider)
      ).map((depositMessage) => {
        return Object.assign(depositMessage, { childNetwork });
      });

      return {
        allParentToChildMessages: messages,
        allDepositMessages: depositMessagesWithNetwork,
        allParentToChildMessagesClassic: [],
      };
    }
  });

  const messages = await Promise.all(messagesPromises);

  const allMessages = messages.reduce(
    (acc: ParentToChildMessagesAndDepositMessages, value) => {
      if (!value) {
        return acc;
      }

      return {
        retryables: acc.retryables.concat(value.allParentToChildMessages),
        retryablesClassic: acc.retryablesClassic.concat(
          value.allParentToChildMessagesClassic,
        ),
        deposits: acc.deposits.concat(value.allDepositMessages),
      };
    },
    {
      retryables: [],
      retryablesClassic: [],
      deposits: [],
    } as ParentToChildMessagesAndDepositMessages,
  ) as unknown as ParentToChildMessagesAndDepositMessages;

  return allMessages;
};
