"use client";

import { Navigation } from "@/components/Navigation";
import { useSurvey } from "@/hooks/useSurvey";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SurveyDetailPage() {
  const params = useParams();
  const surveyId = params.id as string;
  
  // Load survey from contract
  const { surveyInfo, questions, isLoading } = useSurvey(surveyId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="glass p-12 rounded-2xl text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading survey...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!surveyInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="glass p-12 rounded-2xl text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Survey Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The survey you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/surveys"
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              Browse Surveys
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const status = now > Number(surveyInfo.endTime) ? "ended" : "active";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="glass p-8 rounded-2xl mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {status === "active" ? "🟢 Active" : "⚫ Ended"}
                </span>
                <span className="text-sm text-gray-500">
                  Contract: {surveyId.slice(0, 6)}...{surveyId.slice(-4)}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {surveyInfo.title}
              </h1>

              {surveyInfo.description && (
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {surveyInfo.description}
                </p>
              )}

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <span>👤</span>
                  <span>Creator: {surveyInfo.creator.slice(0, 6)}...{surveyInfo.creator.slice(-4)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>Participants: 🔒 Encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>
                    Start: {new Date(Number(surveyInfo.startTime) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📅</span>
                  <span>
                    End: {new Date(Number(surveyInfo.endTime) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>❓</span>
                  <span>Questions: {questions.length}</span>
                </div>
              </div>
            </div>

            {status === "active" && (
              <Link
                href={`/surveys/${surveyId}/participate`}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all font-semibold shadow-lg"
              >
                📝 Participate
              </Link>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Survey Information
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="glass p-4 rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 mb-1">Max Participants</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  🔒 Encrypted
                </div>
              </div>
              <div className="glass p-4 rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 mb-1">Privacy Level</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {["Creator Only", "Public After End", "Participants Can View"][surveyInfo.privacyLevel] || "Creator Only"}
                </div>
              </div>
              <div className="glass p-4 rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 mb-1">Multiple Submissions</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {surveyInfo.allowMultipleSubmissions ? "Allowed" : "Not Allowed"}
                </div>
              </div>
              <div className="glass p-4 rounded-lg">
                <div className="text-gray-500 dark:text-gray-400 mb-1">Status</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {surveyInfo.active ? "Active" : "Inactive"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            🔒 Privacy Protected
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All responses to this survey are encrypted on-chain using FHEVM technology. 
            Only authorized parties can decrypt the results based on the privacy settings.
          </p>
        </div>
      </div>
    </div>
  );
}
