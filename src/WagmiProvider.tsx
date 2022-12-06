import {
  WagmiConfig,
  createClient,
  configureChains,
  defaultChains,
  defaultL2Chains,
  Chain
} from "wagmi";

import { publicProvider } from "wagmi/providers/public";
import { infuraProvider } from "wagmi/providers/infura";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { CoinbaseWalletConnector } from "wagmi/connectors/coinbaseWallet";
import { InjectedConnector } from "wagmi/connectors/injected";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { WalletConnectConnector } from "wagmi/connectors/walletConnect";
import { PropsWithChildren } from "react";

if (!process.env.REACT_APP_INFURA_KEY) {
  throw new Error("REACT_APP_INFURA_KEY is missing in .env");
}

const availableChains: Chain[] = [
  ...defaultChains, // mainnet, goerli
  ...defaultL2Chains.filter(({ id }) => id === 421613 || id === 42161) // Arbitrum One, Arbitrum goerli
];

const { chains, provider, webSocketProvider } = configureChains(
  availableChains,
  [
    infuraProvider({ apiKey: process.env.REACT_APP_INFURA_KEY }),
    publicProvider(),
    jsonRpcProvider({
      rpc: (chain) => ({ http: chain.rpcUrls.default })
    })
  ]
);

const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({
      chains,
      options: {
        shimChainChangedDisconnect: true
      }
    }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: "Arbitrum Retryable Dashboard"
      }
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true
      }
    }),
    new InjectedConnector({
      chains,
      options: {
        name: "Injected",
        shimDisconnect: true
      }
    })
  ],
  provider,
  webSocketProvider
});

export const WagmiProvider = ({ children }: PropsWithChildren<{}>) => {
  return <WagmiConfig client={client}>{children}</WagmiConfig>;
};
