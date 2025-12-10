'use client';

import React, { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
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
    const [apiTested, setApiTested] = React.useState(false);

    // Test API endpoint on mount
    useEffect(() => {
        if (!apiTested && userId) {
            console.log("🧪 Testing API endpoint...");
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'test' }],
                    userId: userId,
                })
            })
            .then(res => {
                console.log("✅ API endpoint is reachable, status:", res.status);
                setApiTested(true);
            })
            .catch(err => {
                console.error("❌ API endpoint test failed:", err);
                setApiTested(true);
            });
        }
    }, [userId, apiTested]);

    const chatHook = useChat({ // Store the entire hook result
        api: '/api/chat',
        body: {
            userId: userId || undefined, // Only include if available
            id: chatId || undefined,
        },
        onError: (error) => {
            console.error("=".repeat(80));
            console.error("❌ Chat Error (Frontend):");
            console.error("  - Error:", error);
            console.error("  - Error type:", error?.constructor?.name || typeof error);
            console.error("  - Error message:", error?.message || "No message");
            console.error("  - Timestamp:", new Date().toISOString());
            console.error("=".repeat(80));
        },
        onResponse: (response) => {
            console.log("=".repeat(80));
            console.log("📥 Chat Response Received:");
            console.log("  - Status:", response.status, response.statusText);
            console.log("  - Headers:", Object.fromEntries(response.headers.entries()));
            
            const newChatId = response.headers.get('X-Chat-Id');
            const isOffline = response.headers.get('X-Lunar-Offline') === 'true';
            const dbStatus = response.headers.get('X-DB-Status');
            const requestTime = response.headers.get('X-Request-Time');
            
            console.log("  - Chat ID:", newChatId);
            console.log("  - DB Status:", dbStatus || (isOffline ? 'offline' : 'unknown'));
            console.log("  - Request Time:", requestTime ? `${requestTime}ms` : 'N/A');
            console.log("=".repeat(80));

            if (newChatId && newChatId !== chatId) {
                console.log("🆕 New chat created, updating state:", newChatId);
                onChatCreated(newChatId);
                // If backend is offline, ensure we track this ID locally immediately
                if (isOffline) {
                    const storedChats = JSON.parse(localStorage.getItem('lunar_chats') || '[]');
                    const exists = storedChats.find((c: any) => c._id === newChatId);
                    if (!exists) {
                        const newChat = {
                            _id: newChatId,
                            title: 'New Chat',
                            updatedAt: new Date().toISOString(),
                            messages: []
                        };
                        localStorage.setItem('lunar_chats', JSON.stringify([newChat, ...storedChats]));
                        console.log("💾 Saved new chat to localStorage");
                    }
                }
            }
        },
        onFinish: (message) => {
            // Save to local storage for persistence if offline or as backup
            if (chatId) {
                const storedChats = JSON.parse(localStorage.getItem('lunar_chats') || '[]');
                const chatIndex = storedChats.findIndex((c: any) => c._id === chatId);

                if (chatIndex >= 0) {
                    storedChats[chatIndex].messages = [...messages, message];
                    storedChats[chatIndex].updatedAt = new Date().toISOString();
                    // Update title if it's the first message
                    if (storedChats[chatIndex].messages.length === 2) {
                        storedChats[chatIndex].title = messages[0].content.substring(0, 50);
                    }
                    localStorage.setItem('lunar_chats', JSON.stringify(storedChats));
                } else {
                    // New chat that wasn't in local storage yet (maybe started online then went offline? or fully offline)
                    // If we have a chatId but it's not in local storage, add it
                    const newChat = {
                        _id: chatId,
                        title: messages[0]?.content.substring(0, 50) || 'New Chat',
                        updatedAt: new Date().toISOString(),
                        messages: [...messages, message]
                    };
                    localStorage.setItem('lunar_chats', JSON.stringify([newChat, ...storedChats]));
                }
            }
        },
    });

    // Log what the hook returns
    useEffect(() => {
        console.log("🔍 useChat Hook Debug:");
        console.log("  - Hook object:", chatHook);
        console.log("  - Hook keys:", chatHook ? Object.keys(chatHook) : "Hook is null/undefined");
        console.log("  - append type:", typeof chatHook?.append);
        console.log("  - append value:", chatHook?.append);
        console.log("  - stop type:", typeof chatHook?.stop);
        console.log("  - messages:", chatHook?.messages?.length || 0);
        console.log("  - isLoading:", chatHook?.isLoading);
        console.log("  - error:", chatHook?.error);
    }, [chatHook]);

    // Destructure with defaults to prevent undefined errors
    const { messages = [], isLoading = false, append, stop = () => {}, error = null } = chatHook || {};

    // Log hook state
    useEffect(() => {
        console.log("🔄 ChatInterface State Update:");
        console.log("  - userId:", userId || "Not connected");
        console.log("  - chatId:", chatId || "New chat");
        console.log("  - messages count:", messages.length);
        console.log("  - isLoading:", isLoading);
        console.log("  - append available:", !!append);
        console.log("  - append type:", typeof append);
        console.log("  - stop available:", !!stop);
        if (error) {
            console.error("  - Error present:", error);
        }
        if (!append) {
            console.warn("⚠️  Append function is not available from useChat hook");
            console.warn("  - This might indicate the hook hasn't initialized properly");
            console.warn("  - Check if the API endpoint '/api/chat' is accessible");
        }
    }, [userId, chatId, messages.length, isLoading, error, append, stop]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();

        // If loading, the button acts as Stop
        if (isLoading) {
            console.log("⏹️  Stopping current request...");
            if (stop) {
                stop();
            } else {
                console.error("❌ Stop function not available");
            }
            return;
        }

        if (!localInput.trim()) {
            console.log("⚠️  Empty message, ignoring");
            return;
        }

        if (!userId) {
            console.error("❌ No userId, cannot send message");
            return;
        }

        if (!append) {
            console.error("=".repeat(80));
            console.error("❌ Append function not available from useChat hook");
            console.error("  - Hook state:", {
                messages: messages.length,
                isLoading,
                hasAppend: !!append,
                hasStop: !!stop,
                error: error?.message || null
            });
            console.error("  - This usually means the useChat hook hasn't initialized properly");
            console.error("  - Check if the API endpoint is accessible and userId is valid");
            console.error("=".repeat(80));
            return;
        }

        const content = localInput;
        console.log("=".repeat(80));
        console.log("📤 Sending Message:");
        console.log("  - Content:", content.substring(0, 100) + (content.length > 100 ? '...' : ''));
        console.log("  - Chat ID:", chatId || "New chat");
        console.log("  - User ID:", userId);
        console.log("  - Timestamp:", new Date().toISOString());
        console.log("=".repeat(80));
        
        setLocalInput('');

        try {
            await append({
                role: 'user',
                content: content,
            });
            console.log("✅ Message sent successfully");
        } catch (err: any) {
            console.error("=".repeat(80));
            console.error("❌ Failed to send message:");
            console.error("  - Error:", err);
            console.error("  - Error message:", err?.message || "No message");
            console.error("  - Error stack:", err?.stack?.substring(0, 300));
            console.error("=".repeat(80));
            setLocalInput(content); // Restore input on error
        }
    };

    const handleSuggestionClick = (text: string) => {
        console.log("💡 Suggestion clicked:", text);
        if (!append) {
            console.warn("⚠️  Append not available, setting input instead");
            setLocalInput(text);
            return;
        }
        
        if (!userId) {
            console.error("❌ No userId, cannot send message");
            return;
        }

        try {
            append({
                role: 'user',
                content: text,
            });
        } catch (err: any) {
            console.error("❌ Failed to send suggestion:", err);
            setLocalInput(text); // Fallback to input
        }
    };

    const isEmpty = messages.length === 0;

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-black via-purple-950/10 to-black">
            {/* Error Display */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mx-6 mt-4"
                >
                    <div className="flex items-start gap-3">
                        <div className="text-red-400 font-bold">❌ Error:</div>
                        <div className="flex-1 text-red-300 text-sm">
                            {error.message || 'An error occurred while processing your request. Please check the console for details.'}
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
                        {isLoading && (
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
                                onChange={(e) => setLocalInput(e.target.value)}
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
