'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import NetworkDisplay from './NetworkDisplay';

export default function Navbar() {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <motion.nav
            className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/10 bg-black/50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="text-white font-bold text-xl flex items-center gap-2 group">
                        <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.5 }}>
                            <Star className="w-6 h-6 text-purple-500 group-hover:text-purple-400" />
                        </motion.div>
                        <span>Lunar Liáo</span>
                    </Link>

                    {/* Navigation Links - Desktop */}
                    <div className="hidden md:flex items-center gap-8">
                       
                        <Link href="/chat" className={`text-sm font-medium hover:text-purple-400 transition-colors ${pathname === '/chat' ? 'text-purple-400' : 'text-white/60'}`}>
                            AI Chat
                        </Link>
                        {/* Get Started Button */}
                        <Link href="/astrologer">
                            <motion.button
                                className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 rounded-full text-white font-semibold text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Get Started
                                <ArrowRight className="w-4 h-4" />
                            </motion.button>
                        </Link>

                        {/* Network Display */}
                        <NetworkDisplay />

                        {/* Connect Button */}
                        <div className="connect-button-wrapper">
                            <ConnectButton showBalance={false} accountStatus="avatar" chainStatus="icon" />
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        className="md:hidden p-2 text-white hover:text-purple-500"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                        </svg>
                    </motion.button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="md:hidden bg-black/95 border-b border-white/10 overflow-hidden"
                >
                    <div className="flex flex-col p-4 space-y-4">
                        <Link href="/" className="text-white hover:text-purple-400" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>
                        <Link href="/chat" className="text-white hover:text-purple-400" onClick={() => setIsMobileMenuOpen(false)}>AI Chat</Link>
                        <Link href="/astrologer" className="text-white hover:text-purple-400" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                        <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
                            <NetworkDisplay />
                            <ConnectButton />
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.nav>
    );
}
