"use client";

import { Navigation } from "@/components/Navigation";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useSurvey } from "@/hooks/useSurvey";
import { useSurveyParticipate } from "@/hooks/useSurveyParticipate";
import { useWallet } from "@/hooks/useWallet";

export default function ParticipatePage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;
  const { surveyInfo, questions: contractQuestions, isLoading } = useSurvey(surveyId);
  const { submitAnswers, isSubmitting } = useSurveyParticipate(surveyId);
  const { isConnected } = useWallet();
  const [answers, setAnswers] = useState<Record<number, any>>({});

  const handleSubmit = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    // Validate that all required questions are answered
    for (let i = 0; i < contractQuestions.length; i++) {
      const question = contractQuestions[i];
      if (question.required && (answers[i] === undefined || answers[i] === null)) {
        alert(`Please answer question ${i + 1}: ${question.questionText}`);
        return;
      }
    }

    try {
      console.log("Submitting encrypted answers:", answers);
      const result = await submitAnswers(answers);
      
      if (result.success) {
        alert(`Survey submitted successfully! Transaction: ${result.txHash}`);
        router.push(`/surveys/${params.id}/thankyou`);
      }
    } catch (error: any) {
      console.error("Submission error:", error);
      alert(`Failed to submit survey: ${error.message || "Unknown error"}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
        <Navigation />
        <div className="max-w-3xl mx-auto px-6 py-12">
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
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="glass p-12 rounded-2xl text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Survey Not Found
            </h2>
          </div>
        </div>
      </div>
    );
  }

  const getQuestionTypeLabel = (type: number): string => {
    const types = ["Single Choice", "Multiple Choice", "Rating", "Scale"];
    return types[type] || "Unknown";
  };

  // Debug: Log questions data
  console.log("[Participate] Questions loaded:", contractQuestions.length);
  contractQuestions.forEach((q, i) => {
    console.log(`[Participate] Q${i + 1}:`, {
      text: q.questionText,
      type: q.questionType,
      optionsCount: q.options?.length || 0,
      options: q.options,
    });
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {surveyInfo.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Your answers will be encrypted on-chain using FHEVM
          </p>
        </div>

        {contractQuestions.length === 0 ? (
          <div className="glass p-12 rounded-2xl text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No questions found in this survey.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {contractQuestions.map((question, index) => (
              <div key={index} className="glass p-8 rounded-2xl">
                <div className="flex items-start space-x-3 mb-6">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                    Q{index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {question.questionText}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Type: {getQuestionTypeLabel(question.questionType)}
                      {question.required && " • Required"}
                    </p>
                  </div>
                </div>

                {/* Single Choice (questionType === 0) */}
                {question.questionType === 0 && (
                  question.options && question.options.length > 0 ? (
                    <div className="space-y-3">
                      {question.options.map((option, oIndex) => (
                        <label
                          key={oIndex}
                          className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-2 border-transparent hover:border-primary"
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={oIndex}
                            onChange={(e) => setAnswers({ ...answers, [index]: parseInt(e.target.value) })}
                            className="w-5 h-5 text-primary"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        No options available for this question. (Debug: options = {JSON.stringify(question.options)})
                      </p>
                    </div>
                  )
                )}

                {/* Rating (questionType === 2) */}
                {question.questionType === 2 && (
                  <div className="flex space-x-4 justify-center py-4">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setAnswers({ ...answers, [index]: rating })}
                        className={`w-12 h-12 rounded-full font-bold transition-all ${
                          answers[index] === rating
                            ? "bg-primary text-white scale-110"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:scale-105"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}

                {/* Scale (questionType === 3) */}
                {question.questionType === 3 && (
                  <div className="flex space-x-4 justify-center py-4">
                    {Array.from({ length: 5 }, (_, i) => i + 1).map((scale) => (
                      <button
                        key={scale}
                        onClick={() => setAnswers({ ...answers, [index]: scale })}
                        className={`w-16 h-16 rounded-lg font-bold text-lg transition-all ${
                          answers[index] === scale
                            ? "bg-primary text-white scale-110"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:scale-105"
                        }`}
                      >
                        {scale}
                      </button>
                    ))}
                  </div>
                )}

                {/* Multiple Choice (questionType === 1) */}
                {question.questionType === 1 && (
                  question.options && question.options.length > 0 ? (
                    <div className="space-y-3">
                      {question.options.map((option, oIndex) => (
                        <label
                          key={oIndex}
                          className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors border-2 border-transparent hover:border-primary"
                        >
                          <input
                            type="checkbox"
                            value={oIndex}
                            onChange={(e) => {
                              const current = answers[index] || [];
                              if (e.target.checked) {
                                setAnswers({ ...answers, [index]: [...current, oIndex] });
                              } else {
                                setAnswers({ ...answers, [index]: current.filter((v: number) => v !== oIndex) });
                              }
                            }}
                            className="w-5 h-5 text-primary"
                          />
                          <span className="text-gray-700 dark:text-gray-300">{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        No options available for this question. (Debug: options = {JSON.stringify(question.options)})
                      </p>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isConnected}
            className={`flex-1 px-8 py-4 rounded-lg transition-all duration-200 shadow-lg text-lg font-semibold ${
              isSubmitting || !isConnected
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary text-white hover:bg-blue-600"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Encrypting & Submitting...
              </span>
            ) : (
              "🔐 Submit Encrypted Answers"
            )}
          </button>
          <button
            onClick={() => router.back()}
            disabled={isSubmitting}
            className={`px-8 py-4 border-2 border-gray-300 rounded-lg transition-all duration-200 text-lg font-semibold ${
              isSubmitting
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 glass p-6 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>🔒 Privacy Note:</strong> Your answers will be encrypted using FHEVM before being submitted to the blockchain. Only authorized parties can decrypt the results.
          </p>
        </div>
      </div>
    </div>
  );
}

