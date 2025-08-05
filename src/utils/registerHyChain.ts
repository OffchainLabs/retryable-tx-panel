import { registerCustomArbitrumNetwork } from '@arbitrum/sdk';
import { EthBridge } from '@arbitrum/sdk/dist/lib/dataEntities/networks';
import { ChainId, hyChain } from './network';

export function registerHyChain() {
  registerCustomArbitrumNetwork({
    chainId: hyChain.id,
    confirmPeriodBlocks: 0,
    ethBridge: {
      inbox: hyChain.inboxAddress,
    } as EthBridge,
    isCustom: true,
    isTestnet: false,
    name: hyChain.name,
    parentChainId: ChainId.Mainnet,
    isBold: false,
  });
}
