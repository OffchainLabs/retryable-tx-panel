import {
  EthDepositMessageWithNetwork,
  L1ToL2MessagesAndDepositMessages,
} from '@/types';
import { getL2Network, L1Network, L1TransactionReceipt } from '@arbitrum/sdk';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { ChainId, rpcURLs } from './network';

export const getL1ToL2MessagesAndDepositMessages = async (
  l1TxnReceipt: L1TransactionReceipt,
  l1Network: L1Network,
): Promise<L1ToL2MessagesAndDepositMessages> => {
  const messagesPromises = Array.from(new Set(l1Network.partnerChainIDs)).map(
    async (l2ChainID) => {
      // TODO: error handle
      const l2Network = await getL2Network(l2ChainID);

      // Check if any l1ToL2 msg is sent to the inbox of this l2Network
      const logFromL2Inbox = l1TxnReceipt.logs.filter((log) => {
        return (
          log.address.toLowerCase() === l2Network.ethBridge.inbox.toLowerCase()
        );
      });
      if (logFromL2Inbox.length === 0) {
        return;
      }

      const l2RpcURL = rpcURLs[l2ChainID as ChainId];
      if (!l2RpcURL) {
        throw new Error(
          'Unknown L2 chain id. This chain is not supported by dashboard',
        );
      }

      const l2Provider = new StaticJsonRpcProvider(l2RpcURL);
      const isClassic = await l1TxnReceipt.isClassic(l2Provider);

      if (isClassic) {
        const messages = (
          await l1TxnReceipt.getL1ToL2MessagesClassic(l2Provider)
        ).map((l1ToL2Message) => {
          return Object.assign(l1ToL2Message, { l2Network });
        });
        return {
          allL1ToL2Messages: [],
          allL1ToL2MessagesClassic: messages,
          allDepositMessages: [],
        };
      } else {
        const messages = (await l1TxnReceipt.getL1ToL2Messages(l2Provider)).map(
          (l1ToL2Message) => {
            return Object.assign(l1ToL2Message, { l2Network });
          },
        );

        const depositMessagesWithNetwork: EthDepositMessageWithNetwork[] = (
          await l1TxnReceipt.getEthDeposits(l2Provider)
        ).map((depositMessage) => {
          return Object.assign(depositMessage, { l2Network });
        });

        return {
          allL1ToL2Messages: messages,
          allDepositMessages: depositMessagesWithNetwork,
          allL1ToL2MessagesClassic: [],
        };
      }
    },
  );

  const messages = await Promise.all(messagesPromises);

  const allMessages = messages.reduce(
    (acc, value) => {
      if (!value) {
        return acc;
      }
      return {
        retryables: acc.retryables.concat(value.allL1ToL2Messages),
        retryablesClassic: acc.retryablesClassic.concat(
          value.allL1ToL2MessagesClassic,
        ),
        deposits: acc.deposits.concat(value.allDepositMessages),
      };
    },
    {
      retryables: [],
      retryablesClassic: [],
      deposits: [],
    } as L1ToL2MessagesAndDepositMessages,
  );
  return allMessages;
};
