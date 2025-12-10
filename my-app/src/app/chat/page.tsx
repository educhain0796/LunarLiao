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
    const [refreshKey, setRefreshKey] = useState(0);

    const bumpRefresh = () => setRefreshKey((k) => k + 1);

    const handleNewChat = async () => {
        // If no wallet, just reset to a fresh local session
        if (!address) {
            setCurrentChatId(null);
            return;
        }

        try {
            const res = await fetch('/api/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: address, title: 'New Chat' }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || res.statusText);
            }

            if (data?._id) {
                setCurrentChatId(data._id);
                bumpRefresh();
            } else {
                setCurrentChatId(null);
            }
        } catch (err) {
            console.error('Failed to create chat:', err);
            setCurrentChatId(null);
        }
    };

    const handleSelectChat = (id: string) => {
        setCurrentChatId(id);
    };

    const handleChatCreated = (id: string) => {
        setCurrentChatId(id);
        bumpRefresh();
    };

    const handleMessagesUpdated = () => {
        bumpRefresh();
    };

    return (
        <div className="h-screen flex flex-col bg-black text-white">
            {/* Navbar */}
            {/* Navbar handled globally in layout */}
            <div className="pt-20 h-full flex flex-col">
                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    <Sidebar
                        userId={address}
                        currentChatId={currentChatId}
                        onSelectChat={handleSelectChat}
                        onNewChat={handleNewChat}
                        refreshKey={refreshKey}
                    />
                    <div className="flex-1">
                        <ChatInterface
                            userId={address}
                            chatId={currentChatId}
                            onChatCreated={handleChatCreated}
                            onMessagesUpdated={handleMessagesUpdated}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
