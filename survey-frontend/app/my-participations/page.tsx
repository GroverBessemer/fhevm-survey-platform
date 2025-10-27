"use client";

import { Navigation } from "@/components/Navigation";
import { useWallet } from "@/hooks/useWallet";
import { useSurveyFactory } from "@/hooks/useSurveyFactory";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Participation {
  id: string;
  address: string;
  title: string;
  status: "active" | "ended";
}

export default function MyParticipationsPage() {
  const { isConnected, address } = useWallet();
  const { getMyParticipations, isReady } = useSurveyFactory();
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadParticipations = async () => {
      if (!isReady || !isConnected) return;
      
      setIsLoading(true);
      try {
        const data = await getMyParticipations();
        setParticipations(data);
      } catch (error) {
        console.error("Failed to load participations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipations();
  }, [isReady, isConnected, getMyParticipations]);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="glass p-12 rounded-2xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Please connect your wallet to view your participations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            My Participations
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Surveys you've participated in
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass p-12 rounded-2xl text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your participations...</p>
          </div>
        )}

        {/* Participation List */}
        {!isLoading && participations.length > 0 && (
          <div className="space-y-4">
            {participations.map((participation) => (
              <div key={participation.id} className="glass p-6 rounded-xl hover:shadow-lg transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {participation.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        participation.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {participation.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <span>🔐</span>
                        <span className="text-encrypted font-semibold">Your answers are encrypted</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Link
                      href={`/surveys/${participation.id}/results`}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
                    >
                      📊 View Results
                    </Link>
                    <Link
                      href={`/surveys/${participation.id}`}
                      className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
                    >
                      View Survey
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && participations.length === 0 && (
          <div className="glass p-12 rounded-2xl text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't participated in any surveys yet
            </p>
            <Link
              href="/surveys"
              className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all font-semibold"
            >
              Browse Surveys
            </Link>
          </div>
        )}

        {/* Privacy Note */}
        <div className="mt-8 glass p-6 rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            🔒 Your Privacy is Protected
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All your survey responses are encrypted on-chain using FHEVM technology. 
            Only you and authorized parties (based on survey settings) can decrypt your answers.
          </p>
        </div>
      </div>
    </div>
  );
}
