"use client"
/* eslint-disable */

import React, { useState, useEffect, useRef } from 'react';
import { Star, Sparkles, Moon, Coins, ArrowRight, ArrowLeft, Twitter, Instagram, LucideIcon } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import NetworkDisplay from './component/NetworkDisplay';


const AstroSpotlightHero = () => {
  // Refs
  const containerRef = useRef(null);
  const horizontalRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // State
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentWord, setCurrentWord] = useState(0);
  const [activeCard, setActiveCard] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isHovering, setIsHovering] = useState(null);

  // Constants
  const words = ['Destiny', 'Fortune', 'Stars', 'Future', 'Cosmos'];

  const features = [
    {
      title: 'PERSONALIZED TOKENS',
      description: 'Unique NFTs based on your astrological chart',
      icon: Moon,
      stats: '10K+ Minted'
    },
    {
      title: 'OPENCAMPUS EDUCHAIN CHAIN',
      description: 'Secure blockchain technology for celestial data',
      icon: Star,
      stats: '99.9% Uptime'
    },
    {
      title: 'DAILY READINGS',
      description: 'AI-powered predictions and insights',
      icon: Sparkles,
      stats: '24/7 Updates'
    },
    {
      title: 'COSMIC REWARDS',
      description: 'Earn tokens through celestial events',
      icon: Coins,
      stats: '50K+ Users'
    }
  ];

  const horizontalSections = [
    {
      title: "Celestial NFTs",
      description: "Each token represents a unique celestial moment captured in time, minted on the blockchain forever",
      image: "https://miro.medium.com/v2/resize:fit:1400/1*qNTfupmMkk8hVm3k5e2J3Q.jpeg",
      color: "from-purple-500"
    },
    {
      title: "Zodiac Collection",
      description: "Exclusive series of 12 zodiac-based digital assets with dynamic properties",
      image: "https://m.media-amazon.com/images/I/81vO7j0Y+LL._AC_UF1000,1000_QL80_.jpg",
      color: "from-blue-500"
    },
    {
      title: "Planetary Alignment",
      description: "Special edition tokens that unlock during rare astronomical events",
      image: "https://cdn.hswstatic.com/gif/planetary-alignment.jpg",
      color: "from-pink-500"
    },
    {
      title: "Star Charts",
      description: "Interactive NFTs that evolve based on real-time celestial movements",
      image: "https://media.istockphoto.com/id/491067579/vector/astronomical-celestial-map-of-the-northern-hemisphere.jpg?s=612x612&w=0&k=20&c=y7ASlXJlpbxDSFx2RWkq4TF7YjLblL_qEQs8gGtRjwQ=",
      color: "from-indigo-500"
    },
    {
      title: "Cosmic Harmony",
      description: "Tokens that grant access to exclusive celestial music based on planetary positions",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTCOYgXb03AvTCAnK6ruX-Bi9_Z-UjSeiCP2Q&s",
      color: "from-purple-500"
    },
    {
      title: "Nebula Dreams",
      description: "Unique NFTs that change their appearance with the discovery of new nebulas",
      image: "https://cdn.pixabay.com/photo/2019/10/29/18/05/nebula-4583276_1280.jpg",
      color: "from-blue-500"
    },
    {
      title: "Galactic Gateway",
      description: "Limited edition tokens that unlock virtual travel experiences to distant galaxies",
      image: "https://cdn.pixabay.com/photo/2015/01/27/16/47/stars-614006_1280.jpg",
      color: "from-green-500"
    }
  ];

  const footerLinks = [
    {
      title: "Community",
      links: ["Discord", "Twitter", "Telegram"]
    },
    {
      title: "Resources",
      links: ["Documentation", "Whitepaper", "Roadmap"]
    },
    {
      title: "Legal",
      links: ["Privacy Policy", "Terms of Service", "FAQ"]
    }
  ];

  // Effects
  useEffect(() => {
    setMounted(true);

    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 3000);

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(wordInterval);
    };
  }, [words.length]);

  // Scroll handling functions
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    if (!scrollContainerRef.current) return;

    const x = e.pageX - (scrollContainerRef.current.offsetLeft || 0);
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCardHover = (index) => {
    setIsHovering(index);
  };

  const handleManualScroll = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 320; // Width of one card
      const newPosition = direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  // Only render client-side content after mounting
  if (!mounted) {
    return null;
  }

  return (
    <div className="relative bg-black">
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <motion.a
              href="#"
              className="text-white font-bold text-xl flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <Star className="w-6 h-6 text-purple-500" />
              Lunar Liáo
            </motion.a>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#">Features</Link>
              <Link href="#">Explore</Link>
              <Link href="#">Community</Link>
              <Link href="/chat" className="text-purple-400 hover:text-purple-300">AI Chat</Link>
              <Link href="#">About</Link>

              {/* Network Display */}
              <NetworkDisplay />

              {/* Connect Button */}
              <div className="connect-button-wrapper">
                <ConnectButton />
              </div>

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
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              className="md:hidden p-2 text-white hover:text-purple-500"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <div ref={containerRef} className="relative min-h-screen overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
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
        </div>

        {/* Spotlight Effect */}
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

        {/* Main Content */}
        <div className="relative z-10 container mx-auto px-4 pt-32 text-center">
          <div className="max-w-6xl mx-auto">
            {/* Title Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block px-4 rounded-full bg-purple-500/10 text-purple-500 tracking-wider animate-pulse">
                BLOCKCHAIN ASTROLOGY
              </span>
            </motion.div>

            <div className="overflow-hidden mb-8">
              <motion.h1
                className="text-6xl md:text-8xl font-bold text-white mb-4 animate-float mt-14"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                LUNAR LIÁO
              </motion.h1>
              <div className="h-24 md:h-32 overflow-hidden">
                <div className="relative">
                  {words.map((word, index) => (
                    <motion.h1
                      key={word}
                      className="text-6xl md:text-8xl font-bold absolute w-full"
                      initial={{ opacity: 0, y: 50 }}
                      animate={{
                        opacity: index === currentWord ? 1 : 0,
                        y: index === currentWord ? 0 : 50
                      }}
                      transition={{ duration: 0.5 }}
                      style={{
                        color: index === currentWord ? '#8B5CF6' : '#ffffff',
                      }}
                    >
                      {word}
                    </motion.h1>
                  ))}
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <motion.div
              className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    className="group p-6 rounded-lg bg-purple-500/5 backdrop-blur-sm hover:bg-purple-500/10 transform hover:-translate-y-2 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <FeatureIcon className="w-8 h-8 text-purple-500 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-white font-mono mb-2">{feature.title}</h3>
                    <p className="text-white/60 text-sm mb-4">{feature.description}</p>
                    <div className="text-purple-400 text-xs font-mono">{feature.stats}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Enhanced Explore Section */}
      <div ref={horizontalRef} className="relative bg-black/90 py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black/90" />
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-500/30 rounded-full"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.5, 1],
                y: ["0%", "100%"]
              }}
              transition={{
                duration: Math.random() * 10 + 5,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4">
          <motion.h2
            className="text-4xl font-bold text-white mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Explore the Cosmos
          </motion.h2>

          <div
            ref={scrollContainerRef}
            className="relative flex gap-8 pb-8 cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {horizontalSections.map((section, index) => (
              <motion.div
                key={`${section.title}-${index}`}
                className="flex-none w-80"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onHoverStart={() => handleCardHover(index)}
                onHoverEnd={() => handleCardHover(null)}
              >
                <motion.div
                  className="h-full rounded-xl overflow-hidden bg-gradient-to-b from-transparent to-purple-900/20 p-1"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="relative aspect-video mb-4 overflow-hidden rounded-lg">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="object-cover w-full h-full"
                    />
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-tr ${section.color} opacity-20`}
                      animate={{
                        opacity: isHovering === index ? 0.4 : 0.2
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0"
                      whileHover={{ opacity: 1 }}
                    >
                      <motion.button
                        className="px-6 py-2 bg-purple-500 rounded-full text-white text-sm"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Explore More
                      </motion.button>
                    </motion.div>
                  </div>
                  <motion.div
                    className="p-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-xl font-bold text-white mb-2">
                      {section.title}</h3>
                    <p className="text-white/60 text-sm">{section.description}</p>
                  </motion.div>
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Navigation Arrows */}
          <motion.div
            className="flex justify-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={() => handleManualScroll('left')}
              className="p-2 rounded-full bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-6 h-6 text-purple-500" />
            </motion.button>
            <motion.button
              onClick={() => handleManualScroll('right')}
              className="p-2 rounded-full bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowRight className="w-6 h-6 text-purple-500" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-black/95 text-white py-16 border-t border-purple-500/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">Join the Cosmic Community</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Connect with astrology enthusiasts and explore the endless possibilities of blockchain technology
            </p>
          </motion.div>

          {/* Footer Grid */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {footerLinks.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <h3 className="text-lg font-bold mb-4 text-purple-400">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <motion.li
                      key={link}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: linkIndex * 0.1 }}
                    >
                      <motion.a
                        href="#"
                        className="text-white/60 hover:text-purple-400 transition-colors"
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {link}
                      </motion.a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          {/* Social Icons */}
          <motion.div
            className="flex justify-center gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.a
              href="#"
              className="text-white/60 hover:text-purple-400 transition-colors"
              whileHover={{ scale: 1.2, rotate: 10 }}
              whileTap={{ scale: 0.95 }}
            >
              <Twitter className="w-6 h-6" />
            </motion.a>
            <motion.a
              href="#"
              className="text-white/60 hover:text-purple-400 transition-colors"
              whileHover={{ scale: 1.2, rotate: -10 }}
              whileTap={{ scale: 0.95 }}
            >
              <Instagram className="w-6 h-6" />
            </motion.a>
          </motion.div>

          {/* Copyright */}
          <motion.div
            className="text-center text-white/40 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            © 2024 Lunar Liáo. All rights reserved.
          </motion.div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite ease-in-out;
        }
        .animate-float {
          animation: float 6s infinite ease-in-out;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .cursor-grab {
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        .cursor-grab:active {
          scroll-snap-type: none;
        }
      `}</style>
    </div>
  );
};

export default AstroSpotlightHero;