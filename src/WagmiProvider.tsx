import {
  WagmiConfig,
  createClient,
  configureChains,
  defaultChains,
  defaultL2Chains,
  Chain
} from "wagmi";

import { publicProvider } from "wagmi/providers/public";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { PropsWithChildren } from "react";

const availableChains: Chain[] = [
  ...defaultChains, // mainnet, goerli
  ...defaultL2Chains.filter(({ id }) => id === 421613 || id === 42161) // Arbitrum One, Arbitrum goerli
];

const { provider, webSocketProvider } = configureChains(availableChains, [
  publicProvider(),
  jsonRpcProvider({
    rpc: (chain) => ({ http: chain.rpcUrls.default })
  })
]);

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider
});

export const WagmiProvider = ({ children }: PropsWithChildren<{}>) => {
  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};
