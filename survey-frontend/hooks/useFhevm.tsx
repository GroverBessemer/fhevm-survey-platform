"use client";

import { useState, useEffect, useCallback } from "react";
import { createFhevmInstance, FhevmAbortError } from "@/fhevm/fhevm";
import type { FhevmInstance, FhevmRelayerStatusType } from "@/fhevm/fhevmTypes";
import { MOCK_CHAINS } from "@/fhevm/constants";

export interface UseFhevmResult {
  instance: FhevmInstance | null;
  isLoading: boolean;
  error: Error | null;
  status: FhevmRelayerStatusType | null;
  retry: () => void;
}

export function useFhevm(provider: any | null): UseFhevmResult {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<FhevmRelayerStatusType | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!provider) {
      setInstance(null);
      setIsLoading(false);
      setError(null);
      setStatus(null);
      return;
    }

    const abortController = new AbortController();
    let mounted = true;

    const initInstance = async () => {
      setIsLoading(true);
      setError(null);
      setStatus(null);

      try {
        console.log("[useFhevm] Creating FHEVM instance...");

        const newInstance = await createFhevmInstance({
          provider,
          mockChains: MOCK_CHAINS,
          signal: abortController.signal,
          onStatusChange: (newStatus) => {
            if (mounted) {
              setStatus(newStatus);
              console.log("[useFhevm] Status:", newStatus);
            }
          },
        });

        if (mounted && !abortController.signal.aborted) {
          console.log("[useFhevm] FHEVM instance created successfully");
          setInstance(newInstance);
          setIsLoading(false);
        }
      } catch (err) {
        if (err instanceof FhevmAbortError) {
          console.log("[useFhevm] Instance creation aborted");
        } else {
          console.error("[useFhevm] Failed to create instance:", err);
          if (mounted) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsLoading(false);
          }
        }
      }
    };

    initInstance();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [provider, retryCount]);

  return {
    instance,
    isLoading,
    error,
    status,
    retry,
  };
}

