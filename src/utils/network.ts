import { addDefaultLocalNetwork } from '@arbitrum/sdk';
import { loadEnvironmentVariableWithFallback } from './loadEnvironmentVariableWithFallback';

export const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;
if (typeof INFURA_KEY === 'undefined') {
  throw new Error('process.env.NEXT_PUBLIC_INFURA_KEY not provided');
}

// L1
const MAINNET_INFURA_RPC_URL = `https://mainnet.infura.io/v3/${INFURA_KEY}`;
const GOERLI_INFURA_RPC_URL = `https://goerli.infura.io/v3/${INFURA_KEY}`;
const SEPOLIA_INFURA_RPC_URL = `https://sepolia.infura.io/v3/${INFURA_KEY}`;
// L2
const ARBITRUM_INFURA_RPC_URL = `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`;
const ARBITRUM_GOERLI_INFURA_RPC_URL = `https://arbitrum-goerli.infura.io/v3/${INFURA_KEY}`;
const ARBITRUM_SEPOLIA_INFURA_RPC_URL = `https://arbitrum-sepolia.infura.io/v3/${INFURA_KEY}`;
const LOCAL_GETH_RPC_URL = `http://localhost:8545`;

export enum ChainId {
  // L1
  Mainnet = 1,
  // L1 Testnets
  Goerli = 5,
  Sepolia = 11155111,
  Local = 1337,
  // L2
  ArbitrumOne = 42161,
  ArbitrumNova = 42170,
  // L2 Testnets
  ArbitrumGoerli = 421613,
  ArbitrumLocal = 412346,
  ArbitrumSepolia = 421614,
}

export const mapChainIdToName: Record<string, string> = {
  [ChainId.Mainnet]: 'Ethereum',
  [ChainId.Goerli]: 'Goerli',
  [ChainId.Sepolia]: 'Sepolia',
  [ChainId.Local]: 'Local',
  [ChainId.ArbitrumOne]: 'Arbitrum One',
  [ChainId.ArbitrumNova]: 'Arbitrum Nova',
  [ChainId.ArbitrumGoerli]: 'Arbitrum Goerli',
  [ChainId.ArbitrumLocal]: 'Arbitrum Local',
  [ChainId.ArbitrumSepolia]: 'Arbitrum Sepolia',
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
  [ChainId.Goerli]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_GOERLI_RPC_URL,
    fallback: GOERLI_INFURA_RPC_URL,
  }),
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
  [ChainId.ArbitrumGoerli]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_RPC_URL,
    fallback: ARBITRUM_GOERLI_INFURA_RPC_URL,
  }),
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
};

export const supportedL1Networks: Partial<RpcMap> = {
  [ChainId.Mainnet]: rpcURLs[ChainId.Mainnet],
  [ChainId.Goerli]: rpcURLs[ChainId.Goerli],
  [ChainId.Sepolia]: rpcURLs[ChainId.Sepolia],
  ...(isE2e ? { [ChainId.Local]: rpcURLs[ChainId.Local] } : {}),
};

export const supportedL2Networks: Partial<RpcMap> = {
  [ChainId.ArbitrumOne]: rpcURLs[ChainId.ArbitrumOne],
  [ChainId.ArbitrumNova]: rpcURLs[ChainId.ArbitrumNova],
  [ChainId.ArbitrumGoerli]: rpcURLs[ChainId.ArbitrumGoerli],
  [ChainId.ArbitrumSepolia]: rpcURLs[ChainId.ArbitrumSepolia],
  ...(isE2e ? { [ChainId.ArbitrumLocal]: rpcURLs[ChainId.ArbitrumLocal] } : {}),
};

// Because of React Server Component, we might need to call this function more than once
export function safeAddDefaultLocalNetwork() {
  try {
    addDefaultLocalNetwork();
  } catch (e) {}
}
