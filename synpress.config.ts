import { Wallet, utils } from 'ethers';
import { defineConfig } from 'cypress';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import synpressPlugins from '@synthetixio/synpress/plugins';

const ethRpcUrl = process.env.NEXT_PUBLIC_LOCAL_ETHEREUM_RPC_URL;
const arbRpcUrl = process.env.NEXT_PUBLIC_LOCAL_ARBITRUM_RPC_URL;

const ethProvider = new StaticJsonRpcProvider(ethRpcUrl);
const arbProvider = new StaticJsonRpcProvider(arbRpcUrl);

const localWallet = new Wallet(process.env.PRIVATE_KEY_CUSTOM!);
const userWallet = new Wallet(process.env.PRIVATE_KEY_USER!);

async function fundUserWallet(networkType: 'L1' | 'L2') {
  console.log(`Funding user wallet: ${networkType}...`);
  const address = await userWallet.getAddress();
  const provider = networkType === 'L1' ? ethProvider : arbProvider;
  const balance = await provider.getBalance(address);
  // Fund only if the balance is less than 2 eth
  if (balance.lt(utils.parseEther('2'))) {
    const tx = await localWallet.connect(provider).sendTransaction({
      to: address,
      value: utils.parseEther('2'),
    });
    await tx.wait();
  }
}

export default defineConfig({
  userAgent: 'synpress',
  retries: 2,
  screenshotsFolder: 'cypress/screenshots',
  videosFolder: 'cypress/videos',
  video: false,
  screenshotOnRunFailure: true,
  chromeWebSecurity: true,
  modifyObstructiveCode: false,
  scrollBehavior: false,
  viewportWidth: 1366,
  viewportHeight: 850,
  env: {
    coverage: false,
  },
  defaultCommandTimeout: 30000,
  pageLoadTimeout: 30000,
  requestTimeout: 30000,
  e2e: {
    async setupNodeEvents(on, config) {
      const userWalletAddress = await userWallet.getAddress();

      await fundUserWallet('L1');
      await fundUserWallet('L2');

      // Set Cypress variables
      config.env.ETH_RPC_URL = ethRpcUrl;
      config.env.ARB_RPC_URL = arbRpcUrl;
      config.env.ADDRESS = userWalletAddress;
      config.env.PRIVATE_KEY = userWallet.privateKey;
      config.env.INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;

      synpressPlugins(on, config);
      return config;
    },
    baseUrl: 'http://localhost:3000',
    specPattern: [
      // order of running the tests...
      'tests/e2e/specs/**/*.cy.{js,jsx,ts,tsx}', // rest of the tests...
    ],
    supportFile: 'tests/support/support.ts',
  },
});
