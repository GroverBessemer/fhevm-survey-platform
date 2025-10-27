"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BrowserProvider } from "ethers";
import { useEip6963 } from "./metamask/useEip6963";
import type { EIP6963ProviderDetail } from "./metamask/Eip6963Types";

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  provider: any | null; // ethers BrowserProvider
  signer: any | null;
  rawProvider: any | null; // EIP-1193 provider
}

const STORAGE_KEYS = {
  connected: "wallet.connected",
  connectorId: "wallet.lastConnectorId",
  connectorName: "wallet.lastConnectorName",
  accounts: "wallet.lastAccounts",
  chainId: "wallet.lastChainId",
};

export function useWallet() {
  const providers = useEip6963();
  const hasAutoReconnected = useRef(false);
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    provider: null,
    signer: null,
    rawProvider: null,
  });

  const clearPersistence = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.connected);
    localStorage.removeItem(STORAGE_KEYS.connectorId);
    localStorage.removeItem(STORAGE_KEYS.connectorName);
    localStorage.removeItem(STORAGE_KEYS.accounts);
    localStorage.removeItem(STORAGE_KEYS.chainId);
  }, []);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    console.log("[Wallet] Accounts changed:", accounts);
    
    if (accounts.length === 0) {
      setState({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
        provider: null,
        signer: null,
        rawProvider: null,
      });
      clearPersistence();
    } else {
      setState((prev) => ({
        ...prev,
        address: accounts[0],
      }));
      localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
    }
  }, [clearPersistence]);

  const handleChainChanged = useCallback((chainIdHex: string) => {
    const chainId = parseInt(chainIdHex, 16);
    console.log("[Wallet] Chain changed:", chainId);
    
    setState((prev) => ({
      ...prev,
      chainId,
    }));
    localStorage.setItem(STORAGE_KEYS.chainId, chainId.toString());

    // Reload page on chain change (recommended by MetaMask)
    window.location.reload();
  }, []);

  const handleDisconnect = useCallback(() => {
    console.log("[Wallet] Disconnected");
    setState({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      provider: null,
      signer: null,
      rawProvider: null,
    });
    clearPersistence();
  }, [clearPersistence]);

  const setupEventListeners = useCallback((provider: any) => {
    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    provider.on("disconnect", handleDisconnect);
  }, [handleAccountsChanged, handleChainChanged, handleDisconnect]);

  const connectToProvider = useCallback(async (
    providerDetail: EIP6963ProviderDetail,
    requestAccounts: boolean = true
  ) => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const provider = providerDetail.provider;

      // Request accounts if needed
      let accounts: string[];
      if (requestAccounts) {
        accounts = await provider.request({
          method: "eth_requestAccounts",
        });
      } else {
        accounts = await provider.request({
          method: "eth_accounts",
        });
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get chainId
      const chainIdHex = await provider.request({
        method: "eth_chainId",
      });
      const chainId = parseInt(chainIdHex, 16);

      // Create ethers provider and signer
      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      // Persist connection
      localStorage.setItem(STORAGE_KEYS.connected, "true");
      localStorage.setItem(STORAGE_KEYS.connectorId, providerDetail.info.uuid);
      localStorage.setItem(STORAGE_KEYS.connectorName, providerDetail.info.name);
      localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEYS.chainId, chainId.toString());

      setState({
        address: accounts[0],
        chainId,
        isConnected: true,
        isConnecting: false,
        error: null,
        provider: ethersProvider,
        signer,
        rawProvider: provider, // Keep the original EIP-1193 provider for FHEVM
      });

      console.log("[Wallet] Connected:", accounts[0], "Chain:", chainId);

      // Setup event listeners
      setupEventListeners(provider);
    } catch (error) {
      console.error("[Wallet] Connection failed:", error);
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    }
  }, [setupEventListeners]);

  // Auto-reconnect on mount
  useEffect(() => {
    const autoReconnect = async () => {
      if (typeof window === "undefined") return;
      if (hasAutoReconnected.current) return; // Only auto-reconnect once

      const wasConnected = localStorage.getItem(STORAGE_KEYS.connected);
      const lastConnectorId = localStorage.getItem(STORAGE_KEYS.connectorId);
      const lastConnectorName = localStorage.getItem(STORAGE_KEYS.connectorName);

      // Wait a bit for EIP-6963 providers to fully announce
      if (wasConnected === "true" && (lastConnectorId || lastConnectorName)) {
        if (providers.length === 0) {
          // Providers not ready yet, will retry when providers.length changes
          return;
        }
        
        // Give a small delay to ensure all providers have announced
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (wasConnected === "true" && providers.length > 0) {
        hasAutoReconnected.current = true; // Mark as attempted
        console.log("[Wallet] Auto-reconnecting...");
        console.log("[Wallet] Looking for connector - UUID:", lastConnectorId, "Name:", lastConnectorName);
        console.log("[Wallet] Available providers:", providers.map(p => ({
          name: p.info.name,
          uuid: p.info.uuid
        })));
        
        // Strategy 1: Try to find by UUID
        let lastProvider = lastConnectorId ? providers.find(
          (p) => p.info.uuid === lastConnectorId
        ) : null;
        
        // Strategy 2: If UUID doesn't match, try to find by name
        if (!lastProvider && lastConnectorName) {
          console.log("[Wallet] UUID not found, trying to find by name...");
          lastProvider = providers.find(
            (p) => p.info.name === lastConnectorName
          );
          
          // Update stored connector ID if found
          if (lastProvider) {
            console.log("[Wallet] Found by name, updating stored UUID");
            localStorage.setItem(STORAGE_KEYS.connectorId, lastProvider.info.uuid);
          }
        }
        
        // Strategy 3: Fallback to any MetaMask provider
        if (!lastProvider) {
          console.log("[Wallet] Exact match not found, looking for MetaMask...");
          lastProvider = providers.find(
            (p) => p.info.name.toLowerCase().includes("metamask")
          );
          
          if (lastProvider) {
            console.log("[Wallet] Found MetaMask, updating stored info");
            localStorage.setItem(STORAGE_KEYS.connectorId, lastProvider.info.uuid);
            localStorage.setItem(STORAGE_KEYS.connectorName, lastProvider.info.name);
          }
        }

        if (lastProvider) {
          console.log("[Wallet] Using provider:", lastProvider.info.name);
          try {
            const provider = lastProvider.provider;
            
            // Silent reconnect using eth_accounts (no popup)
            const accounts = await provider.request({
              method: "eth_accounts",
            });

            if (!accounts || accounts.length === 0) {
              console.log("[Wallet] No accounts found, clearing stale connection");
              clearPersistence();
              return;
            }

            console.log("[Wallet] Found accounts:", accounts[0]);

            // Get chainId
            const chainIdHex = await provider.request({
              method: "eth_chainId",
            });
            const chainId = parseInt(chainIdHex, 16);

            // Create ethers provider and signer
            const ethersProvider = new BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();

            // Update state
            setState({
              address: accounts[0],
              chainId,
              isConnected: true,
              isConnecting: false,
              error: null,
              provider: ethersProvider,
              signer,
              rawProvider: provider,
            });

            console.log("[Wallet] Auto-reconnect successful:", accounts[0], "Chain:", chainId);

            // Setup event listeners
            provider.on("accountsChanged", handleAccountsChanged);
            provider.on("chainChanged", handleChainChanged);
            provider.on("disconnect", handleDisconnect);
          } catch (error) {
            console.error("[Wallet] Auto-reconnect failed:", error);
            clearPersistence();
            hasAutoReconnected.current = false; // Allow retry
          }
        } else {
          console.log("[Wallet] Last provider not found");
          clearPersistence();
        }
      }
    };

    autoReconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers.length]); // Only depend on providers being available

  const connect = useCallback(
    async (providerDetail: EIP6963ProviderDetail) => {
      await connectToProvider(providerDetail, true);
    },
    [connectToProvider]
  );

  const disconnect = useCallback(() => {
    setState({
      address: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      provider: null,
      signer: null,
      rawProvider: null,
    });
    clearPersistence();
    hasAutoReconnected.current = false; // Reset for next mount
    console.log("[Wallet] Disconnected and cleared");
  }, [clearPersistence]);

  const switchChain = useCallback(
    async (targetChainId: number) => {
      if (!state.provider) {
        throw new Error("No provider connected");
      }

      try {
        await (state.provider as any).provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      } catch (error: any) {
        // Chain doesn't exist, try to add it
        if (error.code === 4902) {
          throw new Error("Chain not configured in wallet");
        }
        throw error;
      }
    },
    [state.provider]
  );

  return {
    ...state,
    providers,
    connect,
    disconnect,
    switchChain,
  };
}

