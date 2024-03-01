'use client';
import { WagmiConfig, createClient, configureChains, Chain } from 'wagmi';
import {
  mainnet,
  arbitrum,
  arbitrumGoerli,
  goerli,
  localhost,
  sepolia as sepoliaDefault,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { ReactNode } from 'react';
import { ChainId, rpcURLs } from '@/utils/network';

const ether = { name: 'Ether', symbol: 'ETH', decimals: 18 };

/**
 * For e2e testing
 */
export const localL1Network: Chain = {
  id: ChainId.Local,
  name: 'EthLocal',
  network: 'localhost',
  nativeCurrency: ether,
  rpcUrls: {
    default: { http: [rpcURLs[ChainId.Local]] },
    public: { http: [rpcURLs[ChainId.Local]] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: '' },
  },
};

export const localL2Network: Chain = {
  id: ChainId.ArbitrumLocal,
  name: 'ArbLocal',
  network: 'arbitrum-local',
  nativeCurrency: ether,
  rpcUrls: {
    default: { http: [rpcURLs[ChainId.ArbitrumLocal]] },
    public: { http: [rpcURLs[ChainId.ArbitrumLocal]] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: '' },
  },
};

export const sepolia: Chain = {
  ...sepoliaDefault,
  rpcUrls: {
    ...sepoliaDefault.rpcUrls,
    // override the default public RPC with the Infura RPC
    // public RPCs are getting rate limited
    default: { http: [rpcURLs[ChainId.Sepolia]] },
  },
};

export const arbitrumSepolia: Chain = {
  id: ChainId.ArbitrumSepolia,
  name: 'Arbitrum Sepolia',
  network: 'arbitrum-sepolia',
  nativeCurrency: ether,
  rpcUrls: {
    default: { http: [rpcURLs[ChainId.ArbitrumSepolia]!] },
    public: { http: [rpcURLs[ChainId.ArbitrumSepolia]!] },
  },
};

const { provider, webSocketProvider } = configureChains(
  [
    mainnet,
    goerli,
    sepolia,
    arbitrum,
    arbitrumGoerli,
    arbitrumSepolia,
    localhost,
  ],
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
