'use client';

import { wagmiAdapter, projectId } from '../config';
import { createAppKit } from '@reown/appkit/react';
import { monadTestnet } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type ReactNode } from 'react';
import { WagmiProvider, type Config } from 'wagmi';
import { cookieToInitialState } from 'wagmi';

// Initialize query client
const queryClient = new QueryClient();

// Validate projectId
if (!projectId) {
  throw new Error('Project ID is not defined');
}

// Define metadata
const metadata = {
  name: 'Catcents NFT App',
  description: 'NFT Dashboard for Catcents',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  icons: ['/cat-logo.png'],
};

// Initialize AppKit without storing in a variable
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [{ ...monadTestnet, id: 10143 }],
  metadata,
  features: {
    analytics: true,
    socials:false,
    email:false,
  },
  themeMode: 'light',
});

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;