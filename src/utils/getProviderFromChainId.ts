import { StaticJsonRpcProvider } from '@ethersproject/providers';

export const getProviderFromChainId = (chainID: number) => {
  const l2RpcURL = {
    42161: 'https://arb1.arbitrum.io/rpc',
    421613: 'https://goerli-rollup.arbitrum.io/rpc',
  }[chainID];

  if (!l2RpcURL) {
    throw new Error(
      'Unknown L2 chain id. This chain is not supported by this tool',
    );
  }

  return new StaticJsonRpcProvider(l2RpcURL);
};
