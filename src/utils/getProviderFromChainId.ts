import { ChainId, rpcURLs } from './network';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

export const getProviderFromChainId = (chainID: number) => {
  const childRpcURL = rpcURLs[chainID as ChainId];
  if (!childRpcURL) {
    throw new Error(
      'Unknown L2 chain id. This chain is not supported by this tool',
    );
  }

  return new StaticJsonRpcProvider(childRpcURL);
};
