/**
 * FHEVM Mock Instance for Local Development
 * Uses @fhevm/mock-utils for local Hardhat node testing
 * 
 * WARNING!!
 * ALWAYS USE DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE 
 * FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
 */

import { JsonRpcProvider } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import type { FhevmInstance } from "../fhevmTypes";

export async function fhevmMockCreateInstance(parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> {
  const { rpcUrl, chainId, metadata } = parameters;

  console.log("[fhevmMock] Creating mock instance for chainId:", chainId);
  console.log("[fhevmMock] Metadata:", {
    ACL: metadata.ACLAddress,
    InputVerifier: metadata.InputVerifierAddress,
    KMS: metadata.KMSVerifierAddress,
  });

  // Create ethers provider
  const provider = new JsonRpcProvider(rpcUrl);

  // Create mock FHEVM instance
  const instance = await MockFhevmInstance.create(provider, provider, {
    aclContractAddress: metadata.ACLAddress,
    chainId: chainId,
    gatewayChainId: 55815,
    inputVerifierContractAddress: metadata.InputVerifierAddress,
    kmsContractAddress: metadata.KMSVerifierAddress,
    verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
    verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
  });

  console.log("[fhevmMock] Mock instance created successfully");

  return instance as unknown as FhevmInstance;
}
