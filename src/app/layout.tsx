import React from 'react';
import { Space_Grotesk } from 'next/font/google';

import 'react-tooltip/dist/react-tooltip.css';
import './global.css';
import '@/utils/initializeArbitrumNetworks';

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '600', '700'],
  style: ['normal'],
  subsets: ['latin'],
});

export const metadata = {
  title: 'Arbitrum Tools',
  description: 'Arbitrum tools',
};

export type LayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}
