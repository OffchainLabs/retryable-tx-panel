import {
  safeAddDefaultLocalNetwork,
  supportedL1Networks,
} from '@/utils/network';
import { ReceiptRes } from '@/types';
import { getL1Network, L1TransactionReceipt } from '@arbitrum/sdk';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

export const getL1TxnReceipt = async (
  txnHash: string,
): Promise<ReceiptRes | undefined> => {
  safeAddDefaultLocalNetwork();
  const promises = Object.entries(supportedL1Networks).map(
    async ([chainID, rpcURL]) => {
      try {
        const l1Network = await getL1Network(+chainID);
        const l1Provider = new StaticJsonRpcProvider(rpcURL);
  
        const rec = await l1Provider.getTransactionReceipt(txnHash);
        if (rec) {
          return {
            l1TxnReceipt: new L1TransactionReceipt(rec),
            l1Network,
            l1Provider,
          };
        }
      } catch (e) {
        console.warn(rpcURL, "not working")
      }
    },
  );
  const results = await Promise.all(promises);
  return results.find((r) => r);
};
