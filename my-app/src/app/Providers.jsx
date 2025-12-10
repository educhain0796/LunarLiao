'use client';

import * as React from 'react';
import {
    RainbowKitProvider,
    getDefaultWallets,
    getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import {
    argentWallet,
    trustWallet,
    ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { Toaster } from 'sonner';
import '@rainbow-me/rainbowkit/styles.css';

const storyAeneidTestnet = {
    id: 1315,
    name: 'Story Aeneid Testnet',
    nativeCurrency: { name: 'IP', symbol: 'IP', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://rpc.ankr.com/story_aeneid_testnet'] },
    },
    blockExplorers: {
        default: { name: 'StoryScan', url: 'https://aeneid.storyscan.xyz' },
    },
    testnet: true,
};

const { wallets } = getDefaultWallets();

const config = getDefaultConfig({
    appName: 'Lunar Liao',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'b90f2f3d9c77a89ad5f3be0fc61b9f06',
    wallets: [
        ...wallets,
        {
            groupName: 'Other',
            wallets: [argentWallet, trustWallet, ledgerWallet],
        },
    ],
    chains: [storyAeneidTestnet],
    ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                    <Toaster richColors position="bottom-right" />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
