import { loadEnvironmentVariableWithFallback } from './loadEnvironmentVariableWithFallback';

export const hyChain = {
  id: 2911,
  network: 'hychain',
  name: 'HYCHAIN Mainnet',
  nativeCurrency: {
    name: 'TOPIA',
    symbol: 'TOPIA',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://hychain.calderachain.xyz/http'],
    },
    public: {
      http: ['https://hychain.calderachain.xyz/http'],
    },
  },
  blockExplorers: {
    default: {
      name: 'hychain explorer',
      url: 'https://explorer.hychain.com',
    },
  },
  inboxAddress: '0xD6c596b7ca17870DD50D322393deCE6C2085a116',
};

export const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;
if (typeof INFURA_KEY === 'undefined') {
  throw new Error('process.env.NEXT_PUBLIC_INFURA_KEY not provided');
}

// L1
const MAINNET_INFURA_RPC_URL = `https://mainnet.infura.io/v3/${INFURA_KEY}`;
const SEPOLIA_INFURA_RPC_URL = `https://sepolia.infura.io/v3/${INFURA_KEY}`;
// L2
const ARBITRUM_INFURA_RPC_URL = `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`;
const ARBITRUM_SEPOLIA_INFURA_RPC_URL = `https://arbitrum-sepolia.infura.io/v3/${INFURA_KEY}`;
const LOCAL_GETH_RPC_URL = `http://localhost:8545`;

export enum ChainId {
  // L1
  Mainnet = 1,
  // L1 Testnets
  Sepolia = 11155111,
  Local = 1337,
  // L2
  ArbitrumOne = 42161,
  ArbitrumNova = 42170,
  // L2 Testnets
  ArbitrumLocal = 412346,
  ArbitrumSepolia = 421614,
  // L3
  HyChain = hyChain.id,
}

export const mapChainIdToName: Record<string, string> = {
  [ChainId.Mainnet]: 'Ethereum',
  [ChainId.Sepolia]: 'Sepolia',
  [ChainId.Local]: 'Local',
  [ChainId.ArbitrumOne]: 'Arbitrum One',
  [ChainId.ArbitrumNova]: 'Arbitrum Nova',
  [ChainId.ArbitrumLocal]: 'Arbitrum Local',
  [ChainId.ArbitrumSepolia]: 'Arbitrum Sepolia',
  [ChainId.HyChain]: 'HYCHAIN',
};

const isE2e = process.env.NODE_ENV === 'test';

type RpcMap = Record<ChainId, string>;
export const rpcURLs: RpcMap = {
  // L1
  [ChainId.Mainnet]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
    fallback: MAINNET_INFURA_RPC_URL,
  }),
  // L1 Testnets
  [ChainId.Sepolia]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    fallback: SEPOLIA_INFURA_RPC_URL,
  }),
  // L2
  [ChainId.ArbitrumOne]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
    fallback: ARBITRUM_INFURA_RPC_URL,
  }),
  [ChainId.ArbitrumNova]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_ARBITRUM_NOVA_RPC_URL,
    fallback: 'https://nova.arbitrum.io/rpc',
  }),
  // L2 Testnets
  [ChainId.ArbitrumSepolia]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL,
    fallback: ARBITRUM_SEPOLIA_INFURA_RPC_URL,
  }),
  // E2E RPCs
  [ChainId.Local]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_LOCAL_ETHEREUM_RPC_URL,
    fallback: LOCAL_GETH_RPC_URL,
  }),
  [ChainId.ArbitrumLocal]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_LOCAL_ARBITRUM_RPC_URL,
    fallback: ARBITRUM_INFURA_RPC_URL,
  }),
  [ChainId.HyChain]: hyChain.rpcUrls.default.http[0],
};

export const supportedL1Networks: Partial<RpcMap> = {
  [ChainId.Mainnet]: rpcURLs[ChainId.Mainnet],
  [ChainId.Sepolia]: rpcURLs[ChainId.Sepolia],
  ...(isE2e ? { [ChainId.Local]: rpcURLs[ChainId.Local] } : {}),
};

export const supportedL2Networks: Partial<RpcMap> = {
  [ChainId.ArbitrumOne]: rpcURLs[ChainId.ArbitrumOne],
  [ChainId.ArbitrumNova]: rpcURLs[ChainId.ArbitrumNova],
  [ChainId.ArbitrumSepolia]: rpcURLs[ChainId.ArbitrumSepolia],
  ...(isE2e ? { [ChainId.ArbitrumLocal]: rpcURLs[ChainId.ArbitrumLocal] } : {}),
  [ChainId.HyChain]: rpcURLs[ChainId.HyChain],
};
