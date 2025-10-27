"use client";

import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";

export function Navigation() {
  const { address, isConnected, isConnecting, providers, connect, disconnect } = useWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <nav className="glass border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                FHEVM Survey
              </h1>
            </Link>
            
            {isConnected && (
              <div className="hidden md:flex space-x-6">
                <Link 
                  href="/surveys" 
                  className="text-gray-600 hover:text-primary dark:text-gray-300 transition-colors"
                >
                  Browse
                </Link>
                <Link 
                  href="/create" 
                  className="text-gray-600 hover:text-primary dark:text-gray-300 transition-colors"
                >
                  Create
                </Link>
                <Link 
                  href="/my-surveys" 
                  className="text-gray-600 hover:text-primary dark:text-gray-300 transition-colors"
                >
                  My Surveys
                </Link>
                <Link 
                  href="/my-participations" 
                  className="text-gray-600 hover:text-primary dark:text-gray-300 transition-colors"
                >
                  My Participations
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isConnected && address ? (
              <div className="flex items-center space-x-3">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    {formatAddress(address)}
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                disabled={isConnecting}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-dark max-w-md w-full rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Connect Wallet
              </h2>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {providers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No wallets detected
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Please install MetaMask or another Web3 wallet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {providers.map((provider) => (
                  <button
                    key={provider.info.uuid}
                    onClick={() => {
                      connect(provider);
                      setShowWalletModal(false);
                    }}
                    className="w-full flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    {provider.info.icon && (
                      <img
                        src={provider.info.icon}
                        alt={provider.info.name}
                        className="w-10 h-10 rounded-lg"
                      />
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {provider.info.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {provider.info.rdns}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

