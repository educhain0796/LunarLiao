'use client';

import { useAccount, useSwitchChain } from 'wagmi';
import { motion } from 'framer-motion';

export default function NetworkDisplay() {
    const { chain } = useAccount();
    const { switchChain } = useSwitchChain();

    if (!chain) return null;

    const isStoryTestnet = chain.id === 1516;

    return (
        <motion.div
            className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${isStoryTestnet
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                }`}
            whileHover={{ scale: 1.05 }}
        >
            <div className={`w-2 h-2 rounded-full ${isStoryTestnet ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
            <span>{chain.name}</span>
            {!isStoryTestnet && switchChain && (
                <button
                    onClick={() => switchChain({ chainId: 1516 })}
                    className="ml-1 underline hover:text-white transition-colors"
                >
                    Switch to Story
                </button>
            )}
        </motion.div>
    );
}
