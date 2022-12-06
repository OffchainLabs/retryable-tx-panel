import { useAccount, useConnect, useDisconnect } from "wagmi";

const ConnectButtons = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [activeConnector] = connectors;

  return (
    <>
      {isConnected && (
        <div>
          <div>{address}</div>
          <div>Connected to {activeConnector?.name}</div>
        </div>
      )}
      {isConnected && (
        <button disabled={!activeConnector.ready} onClick={() => disconnect()}>
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
    </>
  );
};

export { ConnectButtons };
