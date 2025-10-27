"use client";

import { Navigation } from "@/components/Navigation";
import { useWallet } from "@/hooks/useWallet";
import { useSurveyFactory } from "@/hooks/useSurveyFactory";
import Link from "next/link";
import { useEffect, useState } from "react";

interface MySurvey {
  id: string;
  address: string;
  title: string;
  status: "active" | "ended";
}

export default function MySurveysPage() {
  const { isConnected, address } = useWallet();
  const { getMySurveys, isReady } = useSurveyFactory();
  const [mySurveys, setMySurveys] = useState<MySurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMySurveys = async () => {
      if (!isReady || !isConnected) return;
      
      setIsLoading(true);
      try {
        const data = await getMySurveys();
        setMySurveys(data);
      } catch (error) {
        console.error("Failed to load my surveys:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMySurveys();
  }, [isReady, isConnected, getMySurveys]);

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
              Please connect your wallet to view your surveys.
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              My Surveys
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your created surveys
            </p>
          </div>
          <Link
            href="/create"
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all shadow-lg font-semibold"
          >
            + Create New Survey
          </Link>
        </div>

        {/* Filters */}
        <div className="glass p-4 rounded-xl mb-8">
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold">
              All
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-semibold transition-colors">
              Active
            </button>
            <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-semibold transition-colors">
              Ended
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass p-12 rounded-2xl text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading your surveys...</p>
          </div>
        )}

        {/* Survey List */}
        {!isLoading && mySurveys.length > 0 && (
          <div className="space-y-4">
            {mySurveys.map((survey) => (
            <div key={survey.id} className="glass p-6 rounded-xl hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {survey.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      survey.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                      {survey.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-2">
                      <span>🔐</span>
                      <span className="text-encrypted font-semibold">Encrypted Survey</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Link
                    href={`/surveys/${survey.id}/results`}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
                  >
                    View Results
                  </Link>
                  <Link
                    href={`/surveys/${survey.id}`}
                    className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-semibold"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {!isLoading && mySurveys.length === 0 && (
          <div className="glass p-12 rounded-2xl text-center">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't created any surveys yet
            </p>
            <Link
              href="/create"
              className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all font-semibold"
            >
              Create Your First Survey
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

