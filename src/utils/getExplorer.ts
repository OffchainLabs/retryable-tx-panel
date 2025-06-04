import { ChainId } from './network';

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
    }[chainId] ?? ''
  );
}
