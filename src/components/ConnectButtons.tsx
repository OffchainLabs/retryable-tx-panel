'use client';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

const ConnectButtons = ({ text }: { text: string }) => {
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
          {text}
        </button>
      )}
      {error && <div>{error.message}</div>}
    </div>
  );
};

export default ConnectButtons;
