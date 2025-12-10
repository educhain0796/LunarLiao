'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { Star } from 'lucide-react';
import Link from 'next/link';
import NetworkDisplay from '../component/NetworkDisplay';

export default function ChatPage() {
    const { address } = useAccount();
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    const handleNewChat = () => {
        setCurrentChatId(null);
    };

    const handleSelectChat = (id: string) => {
        setCurrentChatId(id);
    };

    const handleChatCreated = (id: string) => {
        setCurrentChatId(id);
    };

    return (
        <div className="h-screen flex flex-col bg-black text-white">
            {/* Navbar */}
            <nav className="border-b border-white/10 backdrop-blur-sm bg-black/40">
                <div className="px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl hover:text-purple-400 transition-colors">
                        <Star className="w-6 h-6 text-purple-500" />
                        Lunar Liao
                    </Link>

                    <div className="flex items-center gap-4">
                        <NetworkDisplay />
                        <ConnectButton />
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                <Sidebar
                    userId={address}
                    currentChatId={currentChatId}
                    onSelectChat={handleSelectChat}
                    onNewChat={handleNewChat}
                />
                <div className="flex-1">
                    <ChatInterface
                        userId={address}
                        chatId={currentChatId}
                        onChatCreated={handleChatCreated}
                    />
                </div>
            </div>
        </div>
    );
}
