'use client';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

const ConnectButton = () => {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  return (
    <div className="buttons-wrapper">
      <button
        onClick={() => {
          if (isConnected) {
            disconnect();
          } else {
            openConnectModal?.();
          }
        }}
      >
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
    </div>
  );
};

export default ConnectButton;
