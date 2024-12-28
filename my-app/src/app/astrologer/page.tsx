"use client"
/* eslint-disable */

import React, { useState, useEffect } from 'react';
import { Wallet, Star, MessageCircle, Calendar, Coins, ArrowRight, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserProvider, ethers } from 'ethers';
import contractAddress from "../contractInfo/contractAddress.json"
import contractAbi from "../contractInfo/contractAbi.json"


declare global {
  interface Window {
    ethereum?: {
      isMetaMask: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

type MousePosition = {
  x: number;
  y: number;
};

type Astrologer = {
  id: number;
  name: string;
  speciality: string;
  experience: string;
  rating: number;
  price: string;
  status: 'online' | 'offline';
  image: string;
};

type Horoscope = {
  sign: string;
  date: string;
  prediction: string;
  luckyNumber: number;
  luckyColor: string;
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

// Custom Modal Component
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-gray-900 rounded-xl border border-gray-800 shadow-xl w-full max-w-md overflow-hidden"
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Astrologer: React.FC = () => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [claimable, setClaimable] = useState(true);
  const [selectedAstrologer, setSelectedAstrologer] = useState<Astrologer | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [userBalance, setUserBalance] = useState(150); // Initial balance in LL coins
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');





  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this feature.');
    }
  };

  // Sample data
  const astrologers: Astrologer[] = [
    {
      id: 1,
      name: "Dr. Sarah Miller",
      speciality: "Vedic Astrology",
      experience: "15+ years",
      rating: 4.8,
      price: "30 LL /session",
      status: "online",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRZ9uXmDEHdQP7hbZpKHE1xncC55xcWYQlyGvA1RRxFeE7JMQSZe6ekOO5gyKgjHJr2h6Q&usqp=CAU"
    },
    {
      id: 2,
      name: "John Doe",
      speciality: "Tarot Reading",
      experience: "10+ years",
      rating: 4.6,
      price: "20 LL/session",
      status: "online",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwoRoZ8-5CcxAiZ8X0aGuThFHQFQY03ZjuCET9Qof5E44P-mPTVENZXm3LZxBo963SPdk&usqp=CAU"
    },
    {
      id: 3,
      name: "Emma Wilson",
      speciality: "Numerology",
      experience: "8+ years",
      rating: 4.7,
      price: "35 LL/session",
      status: "offline",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS804xQJxjjhKKQHeo3AwtY_T103P5VojpODOZio3IQO-aEv3LsUa_D0LDEhETyEXQHJNk&usqp=CAU"
    },
  ];

  const horoscope: Horoscope = {
    sign: "Aries",
    date: "October 27, 2024",
    prediction: "Today brings exciting opportunities for personal growth. Your creative energy is at its peak, making it an excellent time to start new projects.",
    luckyNumber: 7,
    luckyColor: "Red"
  };

  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleClaimCoins = () => {
    setClaimable(false);
    withdraw()
  };

  const withdraw = async () => {
    console.log(claimable, "====================")
    const { abi } = contractAbi;
    const amount = 150;
    if (window.ethereum !== undefined) {

      const provider = new BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const bounceContract = new ethers.Contract(contractAddress.address, abi, signer)

      await (await bounceContract.mint(address, ethers.parseUnits(amount.toString(), 18))).wait();
    }

  }


  const handleChatClick = (astrologer: Astrologer) => {
    setSelectedAstrologer(astrologer);
    setShowChatModal(true);
  };

  const handleConfirmChat = () => {
    // Add logic to handle chat confirmation and LL coin deduction
    const costStr = selectedAstrologer?.price.split(' ')[0];
    const cost = costStr ? parseInt(costStr) : 0;

    if (cost <= userBalance) {
      setUserBalance(prev => prev - cost);
      deposit()
      // Additional logic for starting the chat
      setShowChatModal(false);
    } else {
      alert('Insufficient balance!');
    }
  };

  const deposit = async () => {
    const { abi } = contractAbi;
    const charge = 1;
    if (!window.ethereum) {
      console.log("no wallet");

    } else {


      const provider = new BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const bounceContract = new ethers.Contract(contractAddress.address, abi, signer)

      await (await bounceContract.donate(address, "0x94A7Af5edB47c3B91d1B4Ffc2CA535d7aDA8CEDe", ethers.parseUnits(charge.toString(), 18))).wait();
    }

  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Interactive Background */}
      <div className="fixed inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
        <div
          className="absolute inset-0 bg-gradient-radial from-purple-500/30 via-purple-500/10 to-transparent"
          style={{
            transform: `translate(${mousePosition.x}%, ${mousePosition.y}%) scale(2)`,
            left: '-50%',
            top: '-50%',
            width: '200%',
            height: '200%',
            transition: 'transform 0.3s ease-out',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-40 backdrop-blur-sm border-b border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <a href="/" className="text-white font-bold text-xl flex items-center gap-2">
              <Star className="w-6 h-6 text-purple-500" />
              Lunar Liáo
            </a>
            {!walletConnected ? (
              <motion.button
                className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 rounded-full text-white font-semibold text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={connectWallet}
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </motion.button>
            ) : (
              <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium hover:shadow-lg transition-shadow duration-300">
                <span className="text-white text-xs">{walletAddress.slice(0, 5) + '...' + walletAddress.slice(-4)}</span>
              </div>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative pt-28 pb-16 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Astrologers List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="backdrop-blur-md bg-white/5 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Featured Astrologers</h2>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    placeholder="Search astrologers..."
                    className="pl-10 pr-4 py-2 bg-white/5 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="space-y-4">
                {astrologers.map((astrologer) => (
                  <motion.div
                    key={astrologer.id}
                    className="flex items-center gap-4 p-4 backdrop-blur-sm bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <img
                      src={astrologer.image}
                      alt={astrologer.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{astrologer.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${astrologer.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                          {astrologer.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/60">{astrologer.speciality}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-white/60">{astrologer.experience}</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {astrologer.rating}
                        </span>
                        <span className="text-purple-400">{astrologer.price}</span>
                      </div>
                    </div>
                    <motion.button
                      className="px-4 py-2 bg-purple-500 rounded-full text-sm font-semibold flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleChatClick(astrologer)}
                    >
                      Chat Now
                      <MessageCircle className="w-4 h-4" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Kundli Chat Section */}
            <motion.div
              className="backdrop-blur-md bg-white/5 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-2xl font-bold mb-4">Kundli Analysis</h2>
              <p className="text-white/60 mb-4">Get personalized Kundli analysis from our expert astrologers</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="font-semibold mb-2">Birth Chart Analysis</h3>
                  <p className="text-sm text-white/60 mb-4">Understand your planetary positions and their impact</p>
                  <motion.button
                    className="w-full px-4 py-2 bg-purple-500 rounded-full text-sm font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Get Analysis
                  </motion.button>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <h3 className="font-semibold mb-2">Live Consultation</h3>
                  <p className="text-sm text-white/60 mb-4">Direct chat with expert Kundli analysts</p>
                  <motion.button
                    className="w-full px-4 py-2 bg-purple-500 rounded-full text-sm font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Start Chat
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Horoscope and Coins */}
          <div className="space-y-6">
            {/* Daily Horoscope */}
            <motion.div
              className="backdrop-blur-md bg-white/5 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Daily Horoscope</h2>
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{horoscope.sign}</span>
                  <span className="text-sm text-white/60">{horoscope.date}</span>
                </div>
                <p className="text-white/80">{horoscope.prediction}</p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <span className="text-sm text-white/60">Lucky Number</span>
                    <p className="text-lg font-semibold text-purple-400">{horoscope.luckyNumber}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <span className="text-sm text-white/60">Lucky Color</span>
                    <p className="text-lg font-semibold text-purple-400">{horoscope.luckyColor}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Daily Coins */}
            <motion.div
              className="backdrop-blur-md bg-white/5 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Daily Coins</h2>
                <Coins className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-center space-y-4">
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-500">{userBalance} LL</p>
                  <p className="text-sm text-white/60 mt-1">Your Balance</p>
                </div>
                {claimable ? (
                  <motion.button
                    className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-full text-black font-semibold flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClaimCoins}
                  >
                    Claim Daily Coins
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <button
                    className="w-full px-4 py-3 bg-white/5 rounded-full text-white/60 font-semibold cursor-not-allowed"
                    disabled
                  >
                    Claimed Today
                  </button>
                )}
                <p className="text-sm text-white/60">Next claim available in 24h</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Chat Confirmation Modal */}
      <Modal isOpen={showChatModal} onClose={() => setShowChatModal(false)}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">Start Chat Session</h3>
            <button
              onClick={() => setShowChatModal(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {selectedAstrologer && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedAstrologer.image}
                  alt={selectedAstrologer.name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h4 className="font-semibold">{selectedAstrologer.name}</h4>
                  <p className="text-sm text-white/60">{selectedAstrologer.speciality}</p>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Session Cost</span>
                  <span className="font-semibold text-purple-400">
                    {selectedAstrologer.price}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-white/60">Your Balance</span>
                  <span className="font-semibold text-yellow-500">
                    {userBalance} LL
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <motion.button
                  className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-full font-semibold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmChat}
                >
                  Start Chat Session
                </motion.button>
                <button
                  className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 rounded-full font-semibold"
                  onClick={() => setShowChatModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Astrologer;
