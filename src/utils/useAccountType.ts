import { useEffect, useState } from 'react';
import { useAccount, useProvider } from 'wagmi';

type Result = {
  isSmartContractWallet: boolean;
  isLoading: boolean;
};

export function useAccountType(): Result {
  const { address } = useAccount();
  const provider = useProvider();
  const [isSmartContractWallet, setIsSmartContractWallet] = useState<
    boolean | null
  >(null);

  useEffect(() => {
    async function fetchAccountType() {
      if (!address) {
        return;
      }
      try {
        const isSCW = (await provider.getCode(address)).length > 2;
        setIsSmartContractWallet(isSCW);
      } catch (_) {
        setIsSmartContractWallet(false);
      }
    }

    fetchAccountType();
  }, [setIsSmartContractWallet, address, provider]);

  // By default, assume it's an EOA
  return {
    isSmartContractWallet: isSmartContractWallet ?? false,
    isLoading: isSmartContractWallet === null,
  };
}
