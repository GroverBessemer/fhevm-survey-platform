"use client";

import { Navigation } from "@/components/Navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSurveyResults } from "@/hooks/useSurveyResults";
import { useWallet } from "@/hooks/useWallet";
import { useSurvey } from "@/hooks/useSurvey";
import { useSurveyFactory } from "@/hooks/useSurveyFactory";
import Link from "next/link";

export default function ResultsPage() {
  const params = useParams();
  const surveyIndex = params.id as string;
  const { isConnected } = useWallet();
  const { getSurveyAddress, isReady } = useSurveyFactory();
  const [surveyAddress, setSurveyAddress] = useState<string | null>(null);
  
  // Get actual survey address from index
  useEffect(() => {
    const fetchAddress = async () => {
      if (isReady && surveyIndex) {
        try {
          const address = await getSurveyAddress(parseInt(surveyIndex));
          console.log("[ResultsPage] Survey address:", address);
          setSurveyAddress(address);
        } catch (err) {
          console.error("[ResultsPage] Failed to get survey address:", err);
        }
      }
    };
    fetchAddress();
  }, [isReady, surveyIndex, getSurveyAddress]);

  const { surveyInfo, isLoading: loadingInfo } = useSurvey(surveyAddress);
  const {
    results,
    isLoading,
    isDecrypting,
    isCreator,
    loadResults,
    decryptResults,
  } = useSurveyResults(surveyAddress);

  useEffect(() => {
    if (isConnected && surveyAddress) {
      loadResults();
    }
  }, [isConnected, surveyAddress, loadResults]);

  const hasDecryptedData = results.some((r) => r.decryptedCounts && r.decryptedCounts.length > 0);

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
              Please connect your wallet to view survey results.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/surveys/${surveyIndex}`}
            className="inline-flex items-center text-primary hover:text-blue-600 mb-4"
          >
            ← Back to Survey
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Survey Results
          </h1>
          {surveyInfo && (
            <p className="text-gray-600 dark:text-gray-300">
              {surveyInfo.title}
            </p>
          )}
        </div>

        {/* Loading State */}
        {(isLoading || loadingInfo) && (
          <div className="glass p-12 rounded-2xl text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !loadingInfo && results.length === 0 && (
          <div className="glass p-12 rounded-2xl text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-600 dark:text-gray-400">
              No results available yet
            </p>
          </div>
        )}

        {/* Decrypt Button */}
        {!isLoading && !loadingInfo && results.length > 0 && !hasDecryptedData && (
          <div className="glass p-8 rounded-2xl mb-8 text-center">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Results are Encrypted
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              {isCreator
                ? "You are the survey creator. Click below to decrypt the results."
                : "Only the survey creator can decrypt and view the results."}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              🔒 All vote counts are encrypted on-chain using FHEVM
            </p>
            {isCreator && (
              <>
                <button
                  onClick={decryptResults}
                  disabled={isDecrypting}
                  className="px-8 py-4 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDecrypting ? "⏳ Decrypting..." : "🔓 Decrypt Results"}
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  This will request decryption from the FHEVM network
                </p>
              </>
            )}
            {!isCreator && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ You don't have permission to decrypt these results
                </p>
              </div>
            )}
          </div>
        )}

        {/* Results Display */}
        {!isLoading && !loadingInfo && hasDecryptedData && (
          <>
            {/* Summary Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="glass p-6 rounded-xl text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {results.reduce((sum, r) => sum + (r.decryptedCounts?.reduce((a, b) => a + b, 0) || 0), 0)}
                </div>
                <p className="text-gray-600 dark:text-gray-400">Total Responses</p>
              </div>
              <div className="glass p-6 rounded-xl text-center">
                <div className="text-4xl font-bold text-secondary mb-2">{results.length}</div>
                <p className="text-gray-600 dark:text-gray-400">Questions</p>
              </div>
              <div className="glass p-6 rounded-xl text-center">
                <div className="text-4xl font-bold text-accent mb-2">✅</div>
                <p className="text-gray-600 dark:text-gray-400">Encrypted On-Chain</p>
              </div>
            </div>

            {/* Question Results */}
            <div className="space-y-8">
              {results.map((result, index) => {
                const totalVotes = result.decryptedCounts?.reduce((sum, count) => sum + count, 0) || 0;

                return (
                  <div key={index} className="glass p-8 rounded-2xl">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      {index + 1}. {result.questionText}
                    </h3>

                    {/* Bar Chart */}
                    <div className="space-y-4">
                      {result.options.map((option, oIndex) => {
                        const count = result.decryptedCounts?.[oIndex] || 0;
                        const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

                        return (
                          <div key={oIndex} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {option}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {count} votes ({percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between text-sm font-semibold">
                        <span className="text-gray-700 dark:text-gray-300">Total Responses</span>
                        <span className="text-primary">{totalVotes}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Privacy Note */}
            <div className="mt-8 glass p-6 rounded-xl">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                🔒 Privacy-Preserving Results
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                All survey responses were encrypted on-chain using FHEVM technology. 
                The vote counts above were decrypted using your creator permissions.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Individual responses remain private and cannot be traced back to participants.
              </p>
            </div>
          </>
        )}

        {/* Encrypted Results Display (before decryption) */}
        {!isLoading && !loadingInfo && results.length > 0 && !hasDecryptedData && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Encrypted Results Preview
            </h2>
            {results.map((result, index) => (
              <div key={index} className="glass p-6 rounded-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  {index + 1}. {result.questionText}
                </h3>
                <div className="space-y-2">
                  {result.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{option}</span>
                      <span className="text-encrypted font-mono">
                        🔐 {result.optionCounts[oIndex]?.toString().slice(0, 16)}...
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
