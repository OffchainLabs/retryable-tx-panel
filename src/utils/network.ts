import { addDefaultLocalNetwork } from '@arbitrum/sdk';
import { loadEnvironmentVariableWithFallback } from './loadEnvironmentVariableWithFallback';

export const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;
if (typeof INFURA_KEY === 'undefined') {
  throw new Error('process.env.NEXT_PUBLIC_INFURA_KEY not provided');
}

const MAINNET_INFURA_RPC_URL = `https://mainnet.infura.io/v3/${INFURA_KEY}`;
const GOERLI_INFURA_RPC_URL = `https://goerli.infura.io/v3/${INFURA_KEY}`;
const ARBITRUM_INFURA_RPC_URL = `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`;
const ARBITRUM_GOERLI_INFURA_RPC_URL = `https://arbitrum-goerli.infura.io/v3/${INFURA_KEY}`;
const LOCAL_GETH_RPC_URL = `http://localhost:8545`;

export enum ChainId {
  // L1
  Mainnet = 1,
  // L1 Testnets
  Goerli = 5,
  Local = 1337,
  // L2
  ArbitrumOne = 42161,
  ArbitrumNova = 42170,
  // L2 Testnets
  ArbitrumGoerli = 421613,
  ArbitrumLocal = 412346,
}

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
  [ChainId.Local]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_LOCAL_ETHEREUM_RPC_URL,
    fallback: LOCAL_GETH_RPC_URL,
  }),
  // L2
  [ChainId.ArbitrumOne]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL,
    fallback: ARBITRUM_INFURA_RPC_URL,
  }),
  // L2 Testnets
  [ChainId.ArbitrumGoerli]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_ARBITRUM_GOERLI_RPC_URL,
    fallback: ARBITRUM_GOERLI_INFURA_RPC_URL,
  }),
  [ChainId.ArbitrumLocal]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_LOCAL_ARBITRUM_RPC_URL,
    fallback: ARBITRUM_INFURA_RPC_URL,
  }),
  [ChainId.ArbitrumNova]: loadEnvironmentVariableWithFallback({
    env: process.env.NEXT_PUBLIC_ARBITRUM_NOVA_RPC_URL,
    fallback: 'https://nova.arbitrum.io/rpc',
  }),
};

export const supportedL1Networks: Partial<RpcMap> = {
  [ChainId.Mainnet]: rpcURLs[ChainId.Mainnet],
  [ChainId.Goerli]: rpcURLs[ChainId.Goerli],
  [ChainId.Local]: rpcURLs[ChainId.Local],
};

export const supportedL2Networks: Partial<RpcMap> = {
  [ChainId.ArbitrumOne]: rpcURLs[ChainId.ArbitrumOne],
  [ChainId.ArbitrumNova]: rpcURLs[ChainId.ArbitrumNova],
  [ChainId.ArbitrumGoerli]: rpcURLs[ChainId.ArbitrumGoerli],
  [ChainId.ArbitrumLocal]: rpcURLs[ChainId.ArbitrumLocal],
};

// Because of React Server Component, we might need to call this function more than once
export function safeAddDefaultLocalNetwork() {
  try {
    addDefaultLocalNetwork();
  } catch (e) {}
}
