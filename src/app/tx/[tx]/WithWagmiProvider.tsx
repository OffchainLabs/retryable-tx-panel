'use client';
import { WagmiProvider } from '../../../components/WagmiProvider';

const WithWagmiProvider = ({ children }: { children: React.ReactNode }) => {
  return <WagmiProvider>{children}</WagmiProvider>;
};

export { WithWagmiProvider };
