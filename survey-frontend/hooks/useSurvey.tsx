"use client";

import { useEffect, useState } from "react";
import { Contract } from "ethers";
import { useWallet } from "./useWallet";
import { SurveyABI } from "@/abi/SurveyABI";

export interface SurveyInfo {
  creator: string;
  title: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  maxParticipants: bigint;
  currentParticipants: bigint;
  privacyLevel: number;
  allowMultipleSubmissions: boolean;
  active: boolean;
}

export interface Question {
  questionText: string;
  questionType: number;
  options: string[];
  required: boolean;
}

export function useSurvey(surveyAddress: string | null) {
  const { signer } = useWallet();
  const [contract, setContract] = useState<Contract | null>(null);
  const [surveyInfo, setSurveyInfo] = useState<SurveyInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize contract
  useEffect(() => {
    if (!signer || !surveyAddress || surveyAddress === "0x0000000000000000000000000000000000000000") {
      setContract(null);
      return;
    }

    try {
      const surveyContract = new Contract(surveyAddress, SurveyABI.abi, signer);
      setContract(surveyContract);
      console.log("[useSurvey] Contract initialized:", surveyAddress);
    } catch (err) {
      console.error("[useSurvey] Failed to initialize contract:", err);
      setContract(null);
    }
  }, [signer, surveyAddress]);

  // Load survey data
  useEffect(() => {
    const loadSurveyData = async () => {
      if (!contract) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("[useSurvey] Loading survey data...");

        // Load survey info - use getFunction to avoid ENS resolution issues
        const surveyInfoFn = contract.getFunction("surveyInfo");
        const info = await surveyInfoFn();
        console.log("[useSurvey] Survey info:", info);

        setSurveyInfo({
          creator: info.creator,
          title: info.title,
          description: info.description,
          startTime: info.startTime,
          endTime: info.endTime,
          maxParticipants: info.maxParticipants,
          currentParticipants: info.currentParticipants,
          privacyLevel: info.privacyLevel,
          allowMultipleSubmissions: info.allowMultipleSubmissions,
          active: info.active,
        });

        // Load questions - use getFunction to avoid ENS resolution issues
        const getQuestionFn = contract.getFunction("getQuestion");
        const loadedQuestions: Question[] = [];
        let questionIndex = 0;
        
        // Try to load questions one by one until we hit an error
        while (true) {
          try {
            const result = await getQuestionFn(questionIndex);
            
            const question: Question = {
              questionText: result[0],
              questionType: Number(result[1]),
              options: Array.isArray(result[2]) ? result[2] : [],
              required: Boolean(result[3]),
            };
            
            console.log(`[useSurvey] Question ${questionIndex}:`, {
              text: question.questionText,
              type: question.questionType,
              optionsCount: question.options.length,
              options: question.options,
              required: question.required,
            });
            
            loadedQuestions.push(question);
            questionIndex++;
          } catch (err) {
            // No more questions
            console.log(`[useSurvey] No more questions after index ${questionIndex}`);
            break;
          }
        }

        console.log("[useSurvey] Total loaded questions:", loadedQuestions.length);
        setQuestions(loadedQuestions);

        setIsLoading(false);
      } catch (err) {
        console.error("[useSurvey] Failed to load survey data:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    loadSurveyData();
  }, [contract]);

  return {
    contract,
    surveyInfo,
    questions,
    isLoading,
    error,
  };
}

