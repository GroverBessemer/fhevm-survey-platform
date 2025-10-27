"use client";

import { useCallback, useState } from "react";
import { useFhevm } from "./useFhevm";
import { useWallet } from "./useWallet";
import { Contract } from "ethers";
import { SurveyABI } from "@/abi/SurveyABI";

export function useSurveyParticipate(surveyAddress: string | null) {
  const { signer, rawProvider } = useWallet();
  const { instance: fhevmInstance } = useFhevm(rawProvider);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitAnswers = useCallback(
    async (answers: Record<number, number | number[]>) => {
      if (!signer || !fhevmInstance || !surveyAddress) {
        throw new Error("Wallet, FHEVM instance, or survey address not ready");
      }

      setIsSubmitting(true);
      setError(null);

      try {
        console.log("[SurveyParticipate] Submitting answers:", answers);

        const contract = new Contract(surveyAddress, SurveyABI.abi, signer);
        const userAddress = await signer.getAddress();

        // Get number of questions
        const questionCount = await contract.getQuestionCount();
        console.log("[SurveyParticipate] Question count:", Number(questionCount));

        // Create encrypted inputs for all questions
        const input = fhevmInstance.createEncryptedInput(surveyAddress, userAddress);

        // Add all answers to the input (in order)
        for (let i = 0; i < Number(questionCount); i++) {
          const answer = answers[i];
          
          if (answer === undefined || answer === null) {
            // If no answer provided, use 0 as default
            console.log(`[SurveyParticipate] Q${i}: No answer, using 0`);
            input.add32(0);
          } else if (Array.isArray(answer)) {
            // Multiple choice: convert array to bitmask
            let bitmask = 0;
            answer.forEach((optionIndex) => {
              bitmask |= (1 << optionIndex);
            });
            console.log(`[SurveyParticipate] Q${i}: Multiple choice bitmask = ${bitmask}`);
            input.add32(bitmask);
          } else {
            // Single choice, Rating, Scale: use value directly
            console.log(`[SurveyParticipate] Q${i}: Single value = ${answer}`);
            input.add32(Number(answer));
          }
        }

        const encryptedInput = await input.encrypt();
        console.log("[SurveyParticipate] Encrypted input created");
        console.log("[SurveyParticipate] Handles:", encryptedInput.handles);
        console.log("[SurveyParticipate] Handles length:", encryptedInput.handles.length);
        console.log("[SurveyParticipate] Handles type:", typeof encryptedInput.handles);
        console.log("[SurveyParticipate] First handle:", encryptedInput.handles[0]);
        console.log("[SurveyParticipate] First handle type:", typeof encryptedInput.handles[0]);
        console.log("[SurveyParticipate] InputProof:", encryptedInput.inputProof);

        // Submit to contract - pass handles array directly
        // Each element in handles array corresponds to one externalEuint32
        const tx = await contract.submitAnswers(
          encryptedInput.handles,
          encryptedInput.inputProof
        );

        console.log("[SurveyParticipate] Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("[SurveyParticipate] Transaction confirmed:", receipt.hash);

        setIsSubmitting(false);
        return { success: true, txHash: receipt.hash };
      } catch (err) {
        console.error("[SurveyParticipate] Submission failed:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsSubmitting(false);
        throw error;
      }
    },
    [signer, fhevmInstance, surveyAddress]
  );

  return {
    submitAnswers,
    isSubmitting,
    error,
  };
}

