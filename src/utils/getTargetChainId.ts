import { ChainId } from './network';

export const getTargetChainId = (chainID: number | undefined) => {
  const defaultTargetChainId = ChainId.ArbitrumOne;

  if (!chainID) {
    return defaultTargetChainId;
  }

  return (
    {
      [ChainId.Mainnet]: ChainId.ArbitrumOne,
      [ChainId.Goerli]: ChainId.ArbitrumGoerli,
      [ChainId.Sepolia]: ChainId.ArbitrumSepolia,
      [ChainId.ArbitrumOne]: ChainId.ArbitrumOne,
      [ChainId.ArbitrumGoerli]: ChainId.ArbitrumGoerli,
      [ChainId.ArbitrumSepolia]: ChainId.ArbitrumSepolia,
    }[chainID] || defaultTargetChainId
  );
};
