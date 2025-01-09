import { ChainId } from './network';

export const getTargetChainId = (chainID: number | undefined) => {
  const defaultTargetChainId = ChainId.ArbitrumOne;

  if (!chainID) {
    return defaultTargetChainId;
  }

  return (
    {
      [ChainId.Mainnet]: ChainId.ArbitrumOne,
      [ChainId.Sepolia]: ChainId.ArbitrumSepolia,
      [ChainId.ArbitrumOne]: ChainId.ArbitrumOne,
      [ChainId.ArbitrumSepolia]: ChainId.ArbitrumSepolia,
    }[chainID] || defaultTargetChainId
  );
};
