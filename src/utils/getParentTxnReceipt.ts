import { mapChainIdToName, supportedL1Networks } from '@/utils/network';
import { ReceiptRes } from '@/types';
import { ParentTransactionReceipt } from '@arbitrum/sdk';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

export const getParentTxnReceipt = async (
  txnHash: string,
): Promise<ReceiptRes | undefined> => {
  const promises = Object.entries(supportedL1Networks).map(
    async ([chainId, rpcURL]) => {
      try {
        const parentProvider = new StaticJsonRpcProvider(rpcURL);
        const rec = await parentProvider.getTransactionReceipt(txnHash);

        if (rec) {
          return {
            parentTxnReceipt: new ParentTransactionReceipt(rec),
            parentNetwork: {
              chainId: Number(chainId),
              name: mapChainIdToName[chainId],
            },
            parentProvider,
          };
        }
      } catch (e) {
        console.warn(rpcURL, 'not working');
      }
    },
  );
  const results = await Promise.all(promises);
  return results.find((r) => r);
};
