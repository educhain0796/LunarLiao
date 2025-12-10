'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Plus, Trash2, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Chat {
    _id: string;
    title: string;
    updatedAt: string;
}

interface SidebarProps {
    userId: string | undefined;
    currentChatId: string | null;
    onSelectChat: (id: string) => void;
    onNewChat: () => void;
}

export default function Sidebar({ userId, currentChatId, onSelectChat, onNewChat }: SidebarProps) {
    const { data: chats, refetch } = useQuery<Chat[]>({
        queryKey: ['chats', userId],
        queryFn: async () => {
            const localChats = JSON.parse(localStorage.getItem('lunar_chats') || '[]');

            try {
                if (!userId) return localChats; // If no user, just show local chats
                const res = await fetch(`/api/chats?userId=${userId}`);
                if (!res.ok) throw new Error('Failed to fetch chats');
                const apiChats = await res.json();

                // Merge local and API chats, preferring API but keeping local ones that aren't on server yet
                const chatMap = new Map();
                apiChats.forEach((c: any) => chatMap.set(c._id, c));
                localChats.forEach((c: any) => {
                    if (!chatMap.has(c._id)) {
                        chatMap.set(c._id, c);
                    } else {
                        // Optional: Could merge details if local is newer? For now trusted API
                    }
                });

                return Array.from(chatMap.values()).sort((a: any, b: any) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
            } catch (err) {
                console.warn("Using offline chats due to API error:", err);
                return localChats;
            }
        },
        enabled: true, // Always enable to load local chats at least
    });

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this chat?')) return;

        // Remove from local storage first (optimistic/offline support)
        const localChats = JSON.parse(localStorage.getItem('lunar_chats') || '[]');
        const updatedChats = localChats.filter((c: any) => c._id !== id);
        localStorage.setItem('lunar_chats', JSON.stringify(updatedChats));

        try {
            // Attempt to delete from server
            await fetch(`/api/chats/${id}`, { method: 'DELETE' });
        } catch (err) {
            console.error("Failed to delete from server (might be offline), but removed locally:", err);
        } finally {
            refetch();
            if (currentChatId === id) onNewChat();
        }
    };

    return (
        <div className="w-64 bg-black/40 border-r border-white/10 flex flex-col h-full backdrop-blur-md">
            {/* Header */}
            <div className="p-4 border-b border-white/10">
                <button
                    onClick={onNewChat}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-3 flex items-center justify-center gap-2 transition-all font-medium border border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Chat</span>
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-purple-900/50 scrollbar-track-transparent">
                {!userId ? (
                    <div className="text-center p-4 text-white/40 text-sm">
                        Connect wallet to view history
                    </div>
                ) : chats?.length === 0 ? (
                    <div className="text-center p-4 text-white/40 text-sm">
                        No chat history
                    </div>
                ) : (
                    chats?.map((chat) => (
                        <motion.div
                            key={chat._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn(
                                "group relative p-3 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/10",
                                currentChatId === chat._id
                                    ? "bg-purple-900/30 border-purple-500/30 text-white"
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                            onClick={() => onSelectChat(chat._id)}
                        >
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate text-sm font-medium">
                                    {chat.title || 'Untitled Chat'}
                                </span>
                            </div>

                            <button
                                onClick={(e) => handleDelete(e, chat._id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-md transition-all"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 text-xs text-white/30 flex items-center gap-2 justify-center">
                <Moon className="w-3 h-3" />
                Lunar AI v1.0
            </div>
        </div>
    );
}
