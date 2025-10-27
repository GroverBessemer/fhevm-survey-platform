"use client";

import { useCallback, useEffect, useState } from "react";
import { Contract } from "ethers";
import { useWallet } from "./useWallet";
import { useFhevm } from "./useFhevm";
import { SurveyFactoryABI } from "@/abi/SurveyFactoryABI";
import { SurveyFactoryAddresses } from "@/abi/SurveyFactoryAddresses";
import { SurveyABI } from "@/abi/SurveyABI";

interface Survey {
  id: string;
  address: string;
  title: string;
  creator: string;
  status: "active" | "ended";
  startTime: number;
  endTime: number;
  maxParticipants: number;
  currentParticipants: number;
}

export function useSurveyFactory() {
  const { signer, chainId, isConnected, address, rawProvider } = useWallet();
  const { instance: fhevmInstance, isLoading: isFhevmLoading } = useFhevm(rawProvider);
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize contract
  useEffect(() => {
    if (!signer || !chainId) {
      setContract(null);
      return;
    }

    try {
      const chainIdStr = chainId.toString() as "31337" | "11155111";
      const contractAddress = SurveyFactoryAddresses[chainIdStr]?.address;

      if (!contractAddress) {
        console.warn(`[SurveyFactory] No contract deployed on chain ${chainId}`);
        setContract(null);
        return;
      }

      const factoryContract = new Contract(
        contractAddress,
        SurveyFactoryABI.abi,
        signer
      );

      setContract(factoryContract);
      console.log("[SurveyFactory] Contract initialized:", contractAddress);
    } catch (err) {
      console.error("[SurveyFactory] Failed to initialize contract:", err);
      setContract(null);
    }
  }, [signer, chainId]);

  // Create survey
  const createSurvey = useCallback(
    async (params: {
      title: string;
      description: string;
      endTime: number;
      maxParticipants: number;
      privacyLevel: number;
      allowMultiple: boolean;
      questions: Array<{
        questionText: string;
        questionType: number;
        options: string[];
        required: boolean;
      }>;
    }) => {
      if (!contract || !fhevmInstance) {
        throw new Error("Contract or FHEVM instance not ready");
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log("[SurveyFactory] Creating survey:", params.title);

        // Set startTime to future (60 seconds from now) to avoid InvalidTime error
        const startTime = Math.floor(Date.now() / 1000) + 60;

        console.log("[SurveyFactory] Start time:", new Date(startTime * 1000).toISOString());
        console.log("[SurveyFactory] End time:", new Date(params.endTime * 1000).toISOString());

        const tx = await contract.createSurvey(
          params.title,
          params.description,
          startTime,
          params.endTime,
          params.maxParticipants,
          params.privacyLevel,
          params.allowMultiple,
          params.questions
        );

        console.log("[SurveyFactory] Transaction sent:", tx.hash);

        const receipt = await tx.wait();
        console.log("[SurveyFactory] Transaction confirmed:", receipt.hash);

        // Parse event to get survey ID
        const event = receipt.logs.find((log: any) => {
          try {
            return contract.interface.parseLog(log)?.name === "SurveyCreated";
          } catch {
            return false;
          }
        });

        let surveyId = "0";
        if (event) {
          const parsed = contract.interface.parseLog(event);
          surveyId = parsed?.args?.surveyId?.toString() || "0";
        }

        setIsLoading(false);
        return { success: true, surveyId, txHash: receipt.hash };
      } catch (err: any) {
        console.error("[SurveyFactory] Create survey failed:", err);
        setError(err);
        setIsLoading(false);
        throw err;
      }
    },
    [contract, fhevmInstance]
  );

  // Helper function to load survey details
  const loadSurveyDetails = useCallback(
    async (surveyAddress: string, id: string): Promise<Survey | null> => {
      if (!signer) return null;

      try {
        const surveyContract = new Contract(surveyAddress, SurveyABI.abi, signer);
        // Use getFunction to avoid ENS resolution issues on local network
        const surveyInfoFn = surveyContract.getFunction("surveyInfo");
        const info = await surveyInfoFn();

        const now = Math.floor(Date.now() / 1000);
        const status = now > Number(info.endTime) ? "ended" : "active";

        return {
          id,
          address: surveyAddress,
          title: info.title,
          creator: info.creator,
          status,
          startTime: Number(info.startTime),
          endTime: Number(info.endTime),
          maxParticipants: Number(info.maxParticipants),
          currentParticipants: 0, // currentParticipants is encrypted
        };
      } catch (err) {
        console.error(`[SurveyFactory] Failed to load survey ${surveyAddress}:`, err);
        return null;
      }
    },
    [signer]
  );

  // Get all surveys
  const getSurveys = useCallback(
    async (offset: number = 0, limit: number = 20): Promise<Survey[]> => {
      if (!contract || !signer) {
        return [];
      }

      try {
        const surveyAddresses = await contract.getSurveysPaginated(offset, limit);
        console.log("[SurveyFactory] Fetched survey addresses:", surveyAddresses.length);

        // Load details for each survey
        const surveyPromises = surveyAddresses.map((addr: string, index: number) =>
          loadSurveyDetails(addr, (offset + index).toString())
        );

        const surveys = await Promise.all(surveyPromises);
        const validSurveys = surveys.filter((s): s is Survey => s !== null);

        console.log("[SurveyFactory] Loaded survey details:", validSurveys.length);
        return validSurveys;
      } catch (err) {
        console.error("[SurveyFactory] Failed to fetch surveys:", err);
        return [];
      }
    },
    [contract, signer, loadSurveyDetails]
  );

  // Get surveys by creator
  const getMySurveys = useCallback(
    async (): Promise<Survey[]> => {
      if (!contract || !address || !signer) {
        return [];
      }

      try {
        const surveyAddresses = await contract.getSurveysByCreator(address);
        console.log("[SurveyFactory] My survey addresses:", surveyAddresses.length);

        // Load details for each survey
        const surveyPromises = surveyAddresses.map((addr: string, index: number) =>
          loadSurveyDetails(addr, index.toString())
        );

        const surveys = await Promise.all(surveyPromises);
        const validSurveys = surveys.filter((s): s is Survey => s !== null);

        console.log("[SurveyFactory] Loaded my survey details:", validSurveys.length);
        return validSurveys;
      } catch (err) {
        console.error("[SurveyFactory] Failed to fetch my surveys:", err);
        return [];
      }
    },
    [contract, address, signer, loadSurveyDetails]
  );

  // Get surveys by participant
  const getMyParticipations = useCallback(
    async (): Promise<Survey[]> => {
      if (!contract || !address || !signer) {
        return [];
      }

      try {
        const surveyAddresses = await contract.getSurveysByParticipant(address);
        console.log("[SurveyFactory] My participation addresses:", surveyAddresses.length);

        // Load details for each survey
        const surveyPromises = surveyAddresses.map((addr: string, index: number) =>
          loadSurveyDetails(addr, index.toString())
        );

        const surveys = await Promise.all(surveyPromises);
        const validSurveys = surveys.filter((s): s is Survey => s !== null);

        console.log("[SurveyFactory] Loaded my participation details:", validSurveys.length);
        return validSurveys;
      } catch (err) {
        console.error("[SurveyFactory] Failed to fetch my participations:", err);
        return [];
      }
    },
    [contract, address, signer, loadSurveyDetails]
  );

  /**
   * Get survey address by index
   */
  const getSurveyAddress = useCallback(
    async (index: number): Promise<string> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      try {
        console.log("[SurveyFactory] Getting survey address for index:", index);
        const getSurveysFn = contract.getFunction("surveys");
        const address = await getSurveysFn(index);
        console.log("[SurveyFactory] Survey address:", address);
        return String(address);
      } catch (err) {
        console.error("[SurveyFactory] Failed to get survey address:", err);
        throw err;
      }
    },
    [contract]
  );

  return {
    contract,
    isLoading: isLoading || isFhevmLoading,
    error,
    isReady: !!contract && !!fhevmInstance && isConnected,
    createSurvey,
    getSurveys,
    getMySurveys,
    getMyParticipations,
    getSurveyAddress,
  };
}

