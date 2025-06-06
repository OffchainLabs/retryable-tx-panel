import { ChainId, hyChain } from './network';

export function getExplorer(chainId: number) {
  return (
    {
      [ChainId.Mainnet]: 'https://etherscan.io',
      [ChainId.ArbitrumOne]: 'https://arbiscan.io',
      [ChainId.ArbitrumNova]: 'https://nova.arbiscan.io',
      [ChainId.Sepolia]: 'https://sepolia.etherscan.io',
      [ChainId.ArbitrumSepolia]: 'https://sepolia.arbiscan.io',
      [ChainId.Local]: '',
      [ChainId.ArbitrumLocal]: '',
      [ChainId.HyChain]: hyChain.blockExplorers.default.url,
    }[chainId] ?? ''
  );
}
