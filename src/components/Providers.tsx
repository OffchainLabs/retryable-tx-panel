'use client';
import {
  connectorsForWallets,
  darkTheme,
  RainbowKitProvider,
  getDefaultWallets,
} from '@rainbow-me/rainbowkit';
import { trustWallet } from '@rainbow-me/rainbowkit/wallets';
import { PropsWithChildren } from 'react';
import { WagmiConfig, createClient, configureChains, Chain } from 'wagmi';
import {
  mainnet,
  arbitrum,
  localhost,
  sepolia as sepoliaDefault,
} from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { ReactNode } from 'react';
import { ChainId, rpcURLs } from '@/utils/network';
import '@/utils/initializeArbitrumNetworks';

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

const { provider, chains } = configureChains(
  [mainnet, sepolia, arbitrum, arbitrumSepolia, localhost],
  [
    publicProvider(),
    jsonRpcProvider({
      rpc: (chain) => ({ http: rpcURLs[chain.id as ChainId] }),
    }),
  ],
);

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

if (!projectId) {
  console.error('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID variable missing.');
}

const appInfo = {
  appName: 'Bridge to Arbitrum',
  projectId,
};

const { wallets } = getDefaultWallets({
  ...appInfo,
  chains,
});

const connectors = connectorsForWallets([
  ...wallets,
  {
    groupName: 'More',
    wallets: [trustWallet({ chains, projectId })],
  },
]);

// Clear cache for everything related to WalletConnect v2.
//
// TODO: Remove this once the fix for the infinite loop / memory leak is identified.
if (global.window?.localStorage) {
  localStorage.clear();
}

const client = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const WagmiProvider = ({ children }: { children: ReactNode }) => {
  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};

const theme = darkTheme();
const rainbowkitTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    accentColor: 'var(--blue)',
  },
  fonts: {
    ...theme.fonts,
    body: "'Space Grotesk', sans-serif",
  },
};

export function Providers({ children }: PropsWithChildren) {
  return (
    <WagmiProvider>
      <RainbowKitProvider
        theme={rainbowkitTheme}
        chains={chains}
        appInfo={appInfo}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
