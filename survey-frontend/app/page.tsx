"use client";

import { designTokens } from "@/design-tokens";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-4">
            🔒 Powered by FHEVM Technology
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
            Encrypted Surveys
            <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              On Blockchain
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Create and participate in privacy-preserving surveys where answers remain encrypted on-chain.
            Only authorized parties can decrypt results.
          </p>

          <div className="flex gap-4 justify-center mt-8">
            <Link href="/create" className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg text-lg font-semibold">
              Create Survey
            </Link>
            <Link href="/surveys" className="px-8 py-4 bg-white text-primary border-2 border-primary rounded-lg hover:bg-blue-50 transition-all duration-200 text-lg font-semibold">
              Browse Surveys
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="glass p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Full Privacy
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Answers are encrypted on-chain using FHEVM. No one can see individual responses without permission.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Encrypted Statistics
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Compute statistics homomorphically without revealing individual answers.
            </p>
          </div>

          <div className="glass p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Verifiable Results
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              All operations are on-chain and verifiable. Tamper-proof survey results.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 glass p-8 rounded-2xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">🔒 Encrypted</div>
              <p className="text-gray-600 dark:text-gray-300">Total Surveys</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">🔒 Encrypted</div>
              <p className="text-gray-600 dark:text-gray-300">Total Responses</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">🔒 Encrypted</div>
              <p className="text-gray-600 dark:text-gray-300">Active Surveys</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600 dark:text-gray-400">
          <p>Built with FHEVM • Powered by Zama</p>
          <p className="mt-2 text-sm">
            Design System: {designTokens.system} • Color: Blue/Cyan/Teal • Typography: Inter
          </p>
        </div>
      </footer>
    </div>
  );
}

