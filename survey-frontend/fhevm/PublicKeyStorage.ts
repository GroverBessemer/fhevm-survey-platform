/**
 * Public Key Storage for FHEVM
 * Caches public keys to avoid repeated fetching
 */

interface PublicKeyData {
  publicKey: string;
  publicParams: Uint8Array;
}

const STORAGE_KEY_PREFIX = "fhevm.publicKey.";

export async function publicKeyStorageGet(
  aclAddress: string
): Promise<PublicKeyData> {
  const storageKey = `${STORAGE_KEY_PREFIX}${aclAddress.toLowerCase()}`;
  
  if (typeof window !== "undefined" && window.localStorage) {
    const cached = window.localStorage.getItem(storageKey);
    
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        
        // Convert publicParams back to Uint8Array
        const publicParams = new Uint8Array(parsed.publicParams);
        
        console.log("[PublicKeyStorage] Using cached public key");
        return {
          publicKey: parsed.publicKey,
          publicParams,
        };
      } catch (error) {
        console.warn("[PublicKeyStorage] Failed to parse cached key:", error);
      }
    }
  }
  
  // If not cached, fetch from network
  console.log("[PublicKeyStorage] Fetching public key from network...");
  
  // For now, return empty values - actual fetching will be done by FHEVM SDK
  return {
    publicKey: "",
    publicParams: new Uint8Array(),
  };
}

export async function publicKeyStorageSet(
  aclAddress: string,
  publicKey: string,
  publicParams: Uint8Array
): Promise<void> {
  const storageKey = `${STORAGE_KEY_PREFIX}${aclAddress.toLowerCase()}`;
  
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const data = {
        publicKey,
        publicParams: Array.from(publicParams),
      };
      
      window.localStorage.setItem(storageKey, JSON.stringify(data));
      console.log("[PublicKeyStorage] Public key cached");
    } catch (error) {
      console.warn("[PublicKeyStorage] Failed to cache public key:", error);
    }
  }
}

