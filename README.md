# Arbitrum Retryable Dashboard

## Run Locally

1. Clone

   ```bash
   $ git clone https://github.com/OffchainLabs/retryable-tx-panel
   ```

2. Set env vars:

   ```bash
   $ cp .env.sample .env
   ```

3. In `.env`, add your infura key to `NEXT_PUBLIC_INFURA_KEY`

## Available Scripts

In the project directory, you can run:

```bash
$ yarn dev
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

## Run End-to-End (E2E) Tests

1. Set up the Nitro node

   1. Download and install [Docker](https://www.docker.com/)

   2. Check out the [Nitro repo](https://github.com/OffchainLabs/nitro)

   3. Run in nitro repo: (only the first time)

      ```bash
      $ git submodule update --init --recursive
      ```

   4. Run: (Make sure your Docker App is running)

      ```bash
      $ ./test-node.bash --init
      ```

   5. When the Nitro node is up and running you should see logs like `sequencer_1` and `staker-unsafe_1` in the terminal. This can take up to 10 minutes

2. Setup env files:

   1. Run:

      ```bash
      $ cp .e2e.env.sample .e2e.env
      ```

   2. In the newly created file, `.e2e.env`, update your `NEXT_PUBLIC_INFURA_KEY`

3. Run the retryables-panel locally on [http://localhost:3000](http://localhost:3000) with:

   ```bash
   $ yarn dev
   ```

4. Run e2e tests

   ```bash
   $ yarn e2e:run
   ```
