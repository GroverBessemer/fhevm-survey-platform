"use client";

import { Navigation } from "@/components/Navigation";
import { useWallet } from "@/hooks/useWallet";
import { useSurveyFactory } from "@/hooks/useSurveyFactory";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateSurveyPage() {
  const router = useRouter();
  const { isConnected, address } = useWallet();
  const { createSurvey, isLoading, isReady } = useSurveyFactory();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [privacyLevel, setPrivacyLevel] = useState(0);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [questions, setQuestions] = useState([
    { type: 0, text: "", options: ["", ""], required: true },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate minimum datetime (2 minutes from now)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 2);
    return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  };

  const addQuestion = () => {
    setQuestions([...questions, { type: 0, text: "", options: ["", ""], required: true }]);
  };

  const addOption = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push("");
    setQuestions(newQuestions);
  };

  const handleSubmit = async () => {
    if (!isReady) {
      alert("Please wait for contract to initialize...");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a survey title");
      return;
    }

    if (!endDate) {
      alert("Please select an end date");
      return;
    }

    // Validate and calculate end time
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
    const minEndTime = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
    if (endTimestamp <= minEndTime) {
      alert("End date must be at least 2 minutes in the future");
      return;
    }

    if (questions.some(q => !q.text.trim())) {
      alert("Please fill in all question texts");
      return;
    }

    // Validate options for Single Choice and Multiple Choice questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.type === 0 || q.type === 1) { // Single Choice or Multiple Choice
        const validOptions = q.options.filter(opt => opt.trim() !== "");
        if (validOptions.length < 2) {
          alert(`Question ${i + 1}: Please provide at least 2 options for ${q.type === 0 ? 'Single' : 'Multiple'} Choice questions`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {

      const questionConfigs = questions.map(q => {
        let options: string[];
        
        // Generate options based on question type
        if (q.type === 2) {
          // Rating (1-10)
          options = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
        } else if (q.type === 3) {
          // Scale (1-5)
          options = Array.from({ length: 5 }, (_, i) => (i + 1).toString());
        } else {
          // Single Choice or Multiple Choice - use user-provided options
          options = q.options.filter(opt => opt.trim() !== "");
        }

        return {
          questionText: q.text,
          questionType: q.type,
          options: options,
          required: q.required,
        };
      });

      console.log("Creating survey:", { title, endTimestamp, questions: questionConfigs });

      const result = await createSurvey({
        title,
        description,
        endTime: endTimestamp,
        maxParticipants,
        privacyLevel,
        allowMultiple,
        questions: questionConfigs,
      });

      console.log("Survey created:", result);

      alert(`Survey created successfully! Survey ID: ${result.surveyId}`);
      router.push("/my-surveys");
    } catch (error: any) {
      console.error("Failed to create survey:", error);
      alert(`Failed to create survey: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Please connect your wallet to create a survey.
            </p>
            <Link href="/" className="inline-block px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all">
              Go Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Create Encrypted Survey
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            All responses will be encrypted on-chain using FHEVM
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="glass p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Basic Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Survey Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter survey title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Describe your survey..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={getMinDateTime()}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 0)}
                    placeholder="0 = unlimited"
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="glass p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Questions
              </h2>
              <button
                onClick={addQuestion}
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-semibold"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                      Question {qIndex + 1}
                    </span>
                    <select className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                      <option value="rating">Rating (1-5)</option>
                      <option value="scale">Likert Scale</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={question.text}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[qIndex].text = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter question text"
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Options
                    </label>
                    {question.options.map((option, oIndex) => (
                      <input
                        key={oIndex}
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          newQuestions[qIndex].options[oIndex] = e.target.value;
                          setQuestions(newQuestions);
                        }}
                        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder={`Option ${oIndex + 1}`}
                      />
                    ))}
                    <button
                      onClick={() => addOption(qIndex)}
                      className="text-sm text-primary hover:text-blue-600 font-semibold"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="glass p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Privacy Settings
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Results Visibility
                </label>
                <select 
                  value={privacyLevel}
                  onChange={(e) => setPrivacyLevel(parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  <option value="0">Creator Only (Default)</option>
                  <option value="1">Public After End</option>
                  <option value="2">Participants Can View Stats</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allowMultiple"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="allowMultiple" className="text-sm text-gray-700 dark:text-gray-300">
                  Allow multiple submissions from same address
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !isReady || isLoading}
              className="flex-1 px-8 py-4 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "⏳ Creating..." : isReady ? "🔐 Deploy Encrypted Survey" : "⏳ Initializing..."}
            </button>
            <Link 
              href="/"
              className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 text-lg font-semibold text-center"
            >
              Cancel
            </Link>
          </div>

          <div className="glass p-6 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> All responses will be encrypted on-chain using FHEVM. 
              Only authorized parties will be able to decrypt the results based on your privacy settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

