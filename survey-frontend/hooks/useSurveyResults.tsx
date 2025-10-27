"use client";

import { useCallback, useState } from "react";
import { Contract } from "ethers";
import { SurveyABI } from "@/abi/SurveyABI";
import { useWallet } from "./useWallet";
import { useFhevm } from "./useFhevm";
import { Question } from "./useSurvey";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringLocalStorage } from "@/fhevm/GenericStringStorage";

export interface QuestionResult {
  questionText: string;
  questionType: number;
  options: string[];
  optionCounts: bigint[]; // Encrypted counts
  decryptedCounts?: number[]; // Decrypted counts
}

export function useSurveyResults(surveyAddress: string | null) {
  const { signer, address: userAddress, rawProvider } = useWallet();
  const { instance: fhevmInstance } = useFhevm(rawProvider);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  /**
   * Load survey results (encrypted)
   */
  const loadResults = useCallback(async () => {
    if (!signer || !surveyAddress) {
      console.log("[SurveyResults] Missing signer or survey address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contract = new Contract(surveyAddress, SurveyABI.abi, signer);
      console.log("[SurveyResults] Loading results from:", surveyAddress);

      // Get survey info to check if user is creator
      // Use getFunction to avoid ENS resolution issues on local network
      const surveyInfoFn = contract.getFunction("surveyInfo");
      const info = await surveyInfoFn();
      const creator = String(info[0]).toLowerCase();
      setIsCreator(creator === userAddress?.toLowerCase());
      console.log("[SurveyResults] Creator:", creator);
      console.log("[SurveyResults] User:", userAddress?.toLowerCase());
      console.log("[SurveyResults] Is creator:", creator === userAddress?.toLowerCase());

      // Get question count
      const getQuestionFn = contract.getFunction("getQuestion");
      const loadedResults: QuestionResult[] = [];
      let questionIndex = 0;

      while (true) {
        try {
          // Get question details
          const questionResult = await getQuestionFn(questionIndex);
          const questionText = String(questionResult[0]);
          const questionType = Number(questionResult[1]);
          const options = Array.isArray(questionResult[2]) ? questionResult[2].map(String) : [];
          
          console.log(`[SurveyResults] Q${questionIndex}: ${questionText}, options: ${options.length}`);

          // Get encrypted counts for each option
          const optionCounts: bigint[] = [];
          const getOptionCountFn = contract.getFunction("getOptionCount");
          
          for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
            try {
              const encryptedCount = await getOptionCountFn(questionIndex, optionIndex);
              // Store the raw handle (as bigint or string)
              const countValue = typeof encryptedCount === 'bigint' 
                ? encryptedCount 
                : BigInt(encryptedCount.toString());
              optionCounts.push(countValue);
              console.log(`[SurveyResults] Q${questionIndex} Option ${optionIndex} handle:`, countValue.toString());
            } catch (err) {
              console.warn(`[SurveyResults] Failed to get count for Q${questionIndex} O${optionIndex}:`, err);
              optionCounts.push(BigInt(0));
            }
          }

          loadedResults.push({
            questionText,
            questionType,
            options,
            optionCounts,
          });

          questionIndex++;
        } catch (err) {
          console.log(`[SurveyResults] No more questions after index ${questionIndex}`);
          break;
        }
      }

      setResults(loadedResults);
      console.log("[SurveyResults] Loaded results:", loadedResults);
    } catch (err) {
      console.error("[SurveyResults] Failed to load results:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [signer, surveyAddress, userAddress]);

  /**
   * Decrypt results (requires creator permission)
   */
  const decryptResults = useCallback(async () => {
    if (!signer || !surveyAddress || !fhevmInstance || results.length === 0) {
      console.log("[SurveyResults] Cannot decrypt: missing requirements");
      return;
    }

    if (!userAddress) {
      console.log("[SurveyResults] No user address");
      return;
    }

    setIsDecrypting(true);
    setError(null);

    try {
      const contract = new Contract(surveyAddress, SurveyABI.abi, signer);
      console.log("[SurveyResults] Starting decryption for survey:", surveyAddress);

      // Step 1: Call allowResultsDecryption to grant access if needed
      try {
        const allowFn = contract.getFunction("allowResultsDecryption");
        const tx = await allowFn();
        console.log("[SurveyResults] Calling allowResultsDecryption, tx:", tx.hash);
        await tx.wait();
        console.log("[SurveyResults] allowResultsDecryption confirmed");
      } catch (err: any) {
        // May fail if already allowed, that's ok
        console.log("[SurveyResults] allowResultsDecryption error (may be ok):", err.message);
      }

      // Step 2: Create decryption signature storage
      const decryptionSignatureStorage = new GenericStringLocalStorage(
        `fhevm.decryptionSignature.${userAddress.toLowerCase()}`
      );

      // Step 3: Load or create decryption signature
      console.log("[SurveyResults] Loading/creating decryption signature...");
      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [surveyAddress as `0x${string}`],
        signer,
        decryptionSignatureStorage
      );

      if (!sig) {
        throw new Error("Failed to create decryption signature");
      }

      console.log("[SurveyResults] Decryption signature ready");

      // Step 4: Collect all handles to decrypt
      const handlesToDecrypt: Array<{ handle: string; contractAddress: string; qIndex: number; oIndex: number }> = [];
      
      results.forEach((result, qIndex) => {
        result.optionCounts.forEach((count, oIndex) => {
          if (count === BigInt(0)) {
            console.log(`[SurveyResults] Skipping Q${qIndex} O${oIndex}: zero handle`);
            return;
          }

          // Convert bigint to bytes32 hex string (0x + 64 hex chars)
          // FHEVM handles are 256-bit values represented as bytes32
          let handleHex = count.toString(16); // Convert to hex without 0x
          
          // Pad to 64 characters (32 bytes)
          while (handleHex.length < 64) {
            handleHex = "0" + handleHex;
          }
          
          const handle = "0x" + handleHex;
          console.log(`[SurveyResults] Q${qIndex} O${oIndex} handle: ${handle}`);

          handlesToDecrypt.push({
            handle,
            contractAddress: surveyAddress,
            qIndex,
            oIndex,
          });
        });
      });

      console.log("[SurveyResults] Total handles to decrypt:", handlesToDecrypt.length);

      if (handlesToDecrypt.length === 0) {
        console.log("[SurveyResults] No handles to decrypt");
        setIsDecrypting(false);
        return;
      }

      // Step 5: Call userDecrypt
      const decryptInputs = handlesToDecrypt.map(({ handle, contractAddress }) => ({
        handle,
        contractAddress,
      }));

      console.log("[SurveyResults] Calling userDecrypt...");
      const decryptedValues = await fhevmInstance.userDecrypt(
        decryptInputs,
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays
      );

      console.log("[SurveyResults] userDecrypt completed, decrypted values:", decryptedValues);

      // Step 6: Map decrypted values back to results
      const decryptedMap = new Map<string, number>();
      handlesToDecrypt.forEach(({ handle, qIndex, oIndex }) => {
        const value = decryptedValues[handle];
        const numericValue = typeof value === "bigint" ? Number(value) : Number(value);
        decryptedMap.set(`${qIndex}-${oIndex}`, numericValue);
        console.log(`[SurveyResults] Q${qIndex} O${oIndex}: ${numericValue}`);
      });

      // Step 7: Update results with decrypted counts
      const updatedResults = results.map((result, qIndex) => {
        const decryptedCounts = result.optionCounts.map((_, oIndex) => {
          return decryptedMap.get(`${qIndex}-${oIndex}`) || 0;
        });

        return {
          ...result,
          decryptedCounts,
        };
      });

      setResults(updatedResults);
      console.log("[SurveyResults] Decryption complete!");
    } catch (err) {
      console.error("[SurveyResults] Decryption failed:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsDecrypting(false);
    }
  }, [signer, surveyAddress, fhevmInstance, results, userAddress]);

  return {
    results,
    isLoading,
    isDecrypting,
    isCreator,
    error,
    loadResults,
    decryptResults,
  };
}

