"use client";

import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ThankYouPage() {
  const params = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="glass p-12 rounded-2xl">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Thank You!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Your encrypted responses have been submitted successfully.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>🔒 Privacy Protected:</strong><br />
              Your answers are encrypted on-chain and can only be decrypted by authorized parties.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/surveys"
              className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all font-semibold"
            >
              Browse More Surveys
            </Link>
            <Link
              href="/my-participations"
              className="px-8 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold"
            >
              My Participations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

