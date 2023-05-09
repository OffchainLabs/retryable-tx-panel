'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

const Page = () => {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // If user is connected, redirect to page with address prefilled
  useEffect(() => {
    if (isConnected) {
      router.replace(`/recover-funds/${address}`);
    }
  }, [address, isConnected, router]);

  return null;
};

export default Page;
