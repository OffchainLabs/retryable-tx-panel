import { ChainId, rpcURLs } from './network';
import { StaticJsonRpcProvider } from '@ethersproject/providers';

export const getProviderFromChainId = (chainID: number) => {
  const l2RpcURL = {
    [ChainId.ArbitrumOne]: rpcURLs[ChainId.ArbitrumOne],
    [ChainId.ArbitrumGoerli]: rpcURLs[ChainId.ArbitrumGoerli],
  }[chainID];

  if (!l2RpcURL) {
    throw new Error(
      'Unknown L2 chain id. This chain is not supported by this tool',
    );
  }

  return new StaticJsonRpcProvider(l2RpcURL);
};
