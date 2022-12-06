import { useAccount, useConnect, useDisconnect } from "wagmi";

const ConnectButtons = () => {
  const { connector: activeConnector, address, isConnected } = useAccount();
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect();
  const { disconnect } = useDisconnect();

  return (
    <>
      {isConnected && (
        <div>
          <div>{address}</div>
          <div>Connected to {activeConnector?.name}</div>
        </div>
      )}

      {connectors.map((connector) => (
        <button
          disabled={!connector.ready}
          key={connector.id}
          onClick={() =>
            connector.id === activeConnector?.id
              ? disconnect()
              : connect({ connector })
          }
        >
          {connector.name}
          {!connector.ready && " (unsupported)"}
          {isLoading &&
            connector.id === pendingConnector?.id &&
            " (connecting)"}
        </button>
      ))}
      {error && <div>{error.message}</div>}
    </>
  );
};

export { ConnectButtons };
