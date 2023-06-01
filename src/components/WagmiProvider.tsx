'use client';
import { WagmiConfig, createClient, configureChains, Chain } from 'wagmi';
import {
  mainnet,
  arbitrum,
  arbitrumGoerli,
  goerli,
  localhost,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { ReactNode } from 'react';
import { ChainId, rpcURLs } from '@/utils/network';

/**
 * For e2e testing
 */
export const localL1Network: Chain = {
  id: ChainId.Local,
  name: 'EthLocal',
  network: 'localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: rpcURLs[ChainId.Local],
    public: rpcURLs[ChainId.Local],
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: '' },
  },
};

export const localL2Network: Chain = {
  id: ChainId.ArbitrumLocal,
  name: 'ArbLocal',
  network: 'arbitrum-local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: rpcURLs[ChainId.ArbitrumLocal],
    public: rpcURLs[ChainId.ArbitrumLocal],
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: '' },
  },
};

const { provider, webSocketProvider } = configureChains(
  [mainnet, goerli, arbitrum, arbitrumGoerli, localhost],
  [
    publicProvider(),
    jsonRpcProvider({
      rpc: (chain) => ({ http: rpcURLs[chain.id as ChainId] }),
    }),
  ],
);

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
});

export const WagmiProvider = ({ children }: { children: ReactNode }) => {
  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};
