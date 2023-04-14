if (!process.env.NEXT_PUBLIC_INFURA_KEY)
  throw new Error('No NEXT_PUBLIC_INFURA_KEY set');

export const supportedL1Networks = {
  1: `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
  5: `https://goerli.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`,
};

export const supportedL2Networks = {
  42161: `https://arb1.arbitrum.io/rpc`,
  421613: `https://goerli-rollup.arbitrum.io/rpc`,
  42170: `https://nova.arbitrum.io/rpc`,
};
