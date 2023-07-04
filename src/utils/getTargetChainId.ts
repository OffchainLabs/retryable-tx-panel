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
      [ChainId.ArbitrumOne]: ChainId.ArbitrumOne,
      [ChainId.ArbitrumGoerli]: ChainId.ArbitrumGoerli,
    }[chainID] || defaultTargetChainId
  );
};
