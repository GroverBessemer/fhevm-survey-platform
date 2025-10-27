"use client";

import { Navigation } from "@/components/Navigation";
import { useSurveyFactory } from "@/hooks/useSurveyFactory";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Survey {
  id: string;
  address: string;
  title: string;
  creator: string;
  status: "active" | "ended";
}

export default function SurveysPage() {
  const { getSurveys, isReady } = useSurveyFactory();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSurveys = async () => {
      if (!isReady) return;
      
      setIsLoading(true);
      try {
        const data = await getSurveys(0, 20);
        setSurveys(data);
      } catch (error) {
        console.error("Failed to load surveys:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSurveys();
  }, [isReady, getSurveys]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Surveys
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Participate in encrypted surveys
          </p>
        </div>

        {/* Filters */}
        <div className="glass p-6 rounded-2xl mb-8">
          <div className="flex flex-wrap gap-4">
            <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
              <option>All Surveys</option>
              <option>Active</option>
              <option>Ended</option>
            </select>
            <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg">
              <option>Sort by: Newest</option>
              <option>Sort by: Ending Soon</option>
              <option>Sort by: Most Participants</option>
            </select>
            <input
              type="search"
              placeholder="Search surveys..."
              className="flex-1 min-w-[200px] px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass p-12 rounded-2xl text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading surveys...</p>
          </div>
        )}

        {/* Survey Grid */}
        {!isLoading && surveys.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.map((survey) => (
            <Link
              key={survey.address}
              href={`/surveys/${survey.address}`}
              className="glass p-6 rounded-2xl hover:shadow-xl transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  survey.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {survey.status === "active" ? "Active" : "Ended"}
                </span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors">
                {survey.title}
              </h3>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>Creator: {survey.creator.slice(0, 6)}...{survey.creator.slice(-4)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🔐</span>
                  <span className="text-encrypted font-semibold">Encrypted Survey</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    survey.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  }`}>
                    {survey.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-primary font-semibold text-sm group-hover:underline">
                  View Details →
                </span>
              </div>
            </Link>
          ))}
          </div>
        )}

        {!isLoading && surveys.length === 0 && (
          <div className="glass p-12 rounded-2xl text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No surveys found
            </p>
            <Link href="/create" className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all">
              Create First Survey
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

