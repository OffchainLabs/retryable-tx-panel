'use client';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const ConnectButton = () => {
  const { isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [activeConnector] = connectors;

  return (
    <div className="buttons-wrapper">
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
          Connect
        </button>
      )}
      {error && <div>{error.message}</div>}
    </div>
  );
};

export default ConnectButton;
