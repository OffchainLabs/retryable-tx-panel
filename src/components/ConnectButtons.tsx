'use client';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { WagmiProvider } from './WagmiProvider';

const ConnectButtonsInner = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [activeConnector] = connectors;

  return (
    <div className="buttons-wrapper">
      {isConnected && <div>{address}</div>}
      {isConnected && (
        <button
          className="button-outline button-small"
          disabled={!activeConnector.ready}
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      )}
      {!isConnected && (
        <button
          disabled={!activeConnector.ready}
          onClick={() => connect({ connector: activeConnector })}
        >
          Connect to Redeem
        </button>
      )}
      {error && <div>{error.message}</div>}
    </div>
  );
};

const ConnectButtons = () => {
  return (
    <WagmiProvider>
      <ConnectButtonsInner />
    </WagmiProvider>
  );
};

export { ConnectButtons };
