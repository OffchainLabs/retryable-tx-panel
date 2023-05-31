import { defineConfig } from 'cypress';
import synpressPlugins from '@synthetixio/synpress/plugins';

const ethRpcUrl = process.env.NEXT_PUBLIC_LOCAL_ETHEREUM_RPC_URL;
const arbRpcUrl = process.env.NEXT_PUBLIC_LOCAL_ARBITRUM_RPC_URL;

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
      // Set Cypress variables
      config.env.ETH_RPC_URL = ethRpcUrl;
      config.env.ARB_RPC_URL = arbRpcUrl;
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
