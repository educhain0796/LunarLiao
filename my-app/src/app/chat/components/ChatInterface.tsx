'use client';

import React, { useEffect, useRef } from 'react';
import { Send, Sparkles, User, Bot, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
    userId: string | undefined;
    chatId: string | null;
    onChatCreated: (id: string) => void;
}

const suggestions = [
    { icon: '🌟', text: "What's my horoscope for today?" },
    { icon: '♈', text: "Tell me about my zodiac sign" },
    { icon: '💝', text: "Check my love compatibility" },
    { icon: '💼', text: "Career guidance for this week" },
    { icon: '🌙', text: "What do the stars say about me?" },
    { icon: '✨', text: "Lucky numbers for today" },
];

export default function ChatInterface({ userId, chatId, onChatCreated }: ChatInterfaceProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const [localInput, setLocalInput] = React.useState('');
    const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [isFetchingHistory, setIsFetchingHistory] = React.useState(false);

    // Track message list changes for render debugging
    const lastMessageCount = React.useRef<number>(0);
    useEffect(() => {
        if (messages.length !== lastMessageCount.current) {
            console.log("🧾 Messages changed:");
            console.log("  - Previous count:", lastMessageCount.current);
            console.log("  - New count:", messages.length);
            console.log("  - Last message:", messages[messages.length - 1]);
            lastMessageCount.current = messages.length;
        } else {
            console.log("🧾 Messages effect fired with same count:", messages.length);
        }
    }, [messages]);

    // Log hook state
    useEffect(() => {
        console.log("🔄 ChatInterface State Update:");
        console.log("  - userId:", userId || "Not connected");
        console.log("  - chatId:", chatId || "New chat");
        console.log("  - messages count:", messages.length);
        console.log("  - isLoading:", isLoading);
        if (error) {
            console.error("  - Error present:", error);
        }
    }, [userId, chatId, messages.length, isLoading, error]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fetch chat history when a chatId is selected
    useEffect(() => {
        const fetchHistory = async () => {
            if (!chatId || !userId) {
                setMessages([]);
                return;
            }

            setIsFetchingHistory(true);
            setError(null);
            try {
                const res = await fetch(`/api/chats/${chatId}`);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.error || res.statusText);
                }
                if (Array.isArray(data?.messages)) {
                    const normalized = data.messages.map((m: any): { role: 'user' | 'assistant'; content: string } => ({
                        role: m.role === 'assistant' ? 'assistant' : 'user',
                        content: m.content || ''
                    }));
                    setMessages(normalized);
                } else {
                    setMessages([]);
                }
            } catch (err: any) {
                console.error("❌ Failed to fetch chat history:", err);
                setError(err?.message || 'Failed to load chat history');
                setMessages([]);
            } finally {
                setIsFetchingHistory(false);
            }
        };

        fetchHistory();
    }, [chatId, userId]);

    const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
        e?.preventDefault();

        const content = overrideText ?? localInput;

        if (!content.trim()) {
            console.log("⚠️  Empty message, ignoring");
            return;
        }

        if (!userId) {
            console.error("❌ No userId, cannot send message");
            return;
        }

        console.log("=".repeat(80));
        console.log("📤 Sending Message:");
        console.log("  - Content:", content.substring(0, 100) + (content.length > 100 ? '...' : ''));
        console.log("  - Chat ID:", chatId || "New chat");
        console.log("  - User ID:", userId);
        console.log("  - Timestamp:", new Date().toISOString());
        console.log("=".repeat(80));
        
        if (!overrideText) {
            setLocalInput('');
        }

        const nextMessages = [...messages, { role: 'user', content }];
        setMessages(nextMessages);
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: nextMessages,
                    userId: userId,
                    id: chatId || undefined,
                })
            });

            console.log("📥 API response status:", res.status);
            const resJson = await res.json().catch(() => null);
            console.log("📥 API response body:", resJson);

            const newChatId = res.headers.get('X-Chat-Id') || resJson?.chatId;
            if (newChatId && newChatId !== chatId) {
                onChatCreated(newChatId);
            }

            if (!res.ok) {
                throw new Error(resJson?.error || res.statusText);
            }

            if (resJson?.message?.content) {
                const updated = [...nextMessages, { role: 'assistant', content: resJson.message.content }];
                setMessages(updated);
            } else {
                throw new Error('No assistant message returned');
            }
        } catch (err: any) {
            console.error("=".repeat(80));
            console.error("❌ Failed to send message:");
            console.error("  - Error:", err);
            console.error("  - Error message:", err?.message || "No message");
            console.error("  - Error stack:", err?.stack?.substring(0, 300));
            console.error("=".repeat(80));
            setError(err?.message || 'Failed to send message');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (text: string) => {
        console.log("💡 Suggestion clicked:", text);
        if (!userId) {
            console.error("❌ No userId, cannot send message");
            setLocalInput(text);
            return;
        }

        setLocalInput(text);
        handleSendMessage(undefined, text);
    };

    const isEmpty = messages.length === 0 && !isFetchingHistory && !isLoading;

    useEffect(() => {
        console.log("🖥️ Render state:");
        console.log("  - isEmpty:", isEmpty);
        console.log("  - messages length:", messages.length);
        console.log("  - isLoading:", isLoading);
        console.log("  - isFetchingHistory:", isFetchingHistory);
    }, [isEmpty, messages.length, isLoading, isFetchingHistory]);

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-black via-purple-950/10 to-black">
            {/* Error Display */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mx-6 mt-4 relative"
                >
                    <button
                        onClick={() => setError(null)}
                        className="absolute top-2 right-2 text-red-200 hover:text-white transition"
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                    <div className="flex items-start gap-3">
                        <div className="text-red-400 font-bold">❌ Error:</div>
                        <div className="flex-1 text-red-300 text-sm">
                            {error || 'An error occurred while processing your request. Please check the console for details.'}
                        </div>
                    </div>
                    <div className="mt-2 text-red-400/70 text-xs">
                        Check the browser console (F12) for detailed logs.
                    </div>
                </motion.div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isEmpty ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center h-full space-y-8"
                    >
                        {/* Welcome Content */}
                        <div className="text-center space-y-4">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            >
                                <Sparkles className="w-16 h-16 text-purple-400 mx-auto" />
                            </motion.div>
                            <h1 className="text-5xl font-bold text-white tracking-tight">
                                LUNAR AI
                            </h1>
                            <p className="text-white/60 text-lg max-w-md">
                                Your mystical guide to the cosmos. Ask me anything about astrology, horoscopes, and your celestial journey.
                            </p>
                        </div>

                        {/* Suggestions */}
                        <div className="grid grid-cols-2 gap-3 max-w-2xl w-full">
                            {suggestions.map((suggestion, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => handleSuggestionClick(suggestion.text)}
                                    disabled={isLoading || !userId}
                                    className="group p-4 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/50 rounded-xl text-left transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{suggestion.icon}</span>
                                        <span className="text-white/80 group-hover:text-white text-sm">
                                            {suggestion.text}
                                        </span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-6">
                        <AnimatePresence>
                            {messages.map((message, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={cn(
                                        "flex gap-4 items-start",
                                        message.role === 'user' ? 'flex-row-reverse' : ''
                                    )}
                                >
                                    {/* ... Avatar and Message content same as before ... */}
                                    {/* Only rewriting the container logic, but replace_file_content needs context. */}
                                    {/* Using exact match for the map function to ensure cleanliness */}
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                            message.role === 'user'
                                                ? 'bg-purple-600'
                                                : 'bg-gradient-to-br from-purple-500 to-pink-500'
                                        )}
                                    >
                                        {message.role === 'user' ? (
                                            <User className="w-5 h-5 text-white" />
                                        ) : (
                                            <Bot className="w-5 h-5 text-white" />
                                        )}
                                    </div>

                                    <div
                                        className={cn(
                                            "flex-1 p-4 rounded-2xl max-w-2xl",
                                            message.role === 'user'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-white/10 text-white border border-white/10'
                                        )}
                                    >
                                        <div className="whitespace-pre-wrap">{message.content}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Loading Indicator */}
                        {(isLoading || isFetchingHistory) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex gap-4 items-start"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 p-4 rounded-2xl bg-white/10 border border-white/10">
                                    <div className="flex gap-1">
                                        <motion.div
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                            className="w-2 h-2 bg-purple-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                            className="w-2 h-2 bg-purple-400 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ opacity: [0.3, 1, 0.3] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                            className="w-2 h-2 bg-purple-400 rounded-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 bg-black/40 backdrop-blur-md p-4">
                <form
                    ref={formRef}
                    onSubmit={handleSendMessage}
                    className="max-w-4xl mx-auto"
                >
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 relative">
                            <input
                                value={localInput}
                                onChange={(e) => {
                                    setLocalInput(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder={userId ? (isLoading ? "Lunar AI is thinking..." : "Ask about your cosmic journey...") : "Connect wallet to chat"}
                                disabled={!userId || isLoading}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!userId || (!localInput.trim() && !isLoading)}
                            className={cn(
                                "p-4 rounded-2xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100",
                                isLoading
                                    ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                    : "bg-purple-600 hover:bg-purple-700 text-white disabled:bg-white/10 disabled:cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <Square className="w-5 h-5 fill-current" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
