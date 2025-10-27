export interface FhevmInstance {
  getPublicKey(): string;
  getPublicParams(size: number): Uint8Array;
  createEncryptedInput(contractAddress: string, userAddress: string): any;
  encrypt8(value: number): Promise<string>;
  encrypt16(value: number): Promise<string>;
  encrypt32(value: number): Promise<string>;
  encrypt64(value: bigint): Promise<string>;
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): any;
  userDecrypt(
    handles: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ): Promise<Record<string, bigint>>;
  generateKeypair(): { publicKey: string; privateKey: string };
}

export interface FhevmInstanceConfig {
  network: string | any;
  publicKey: string;
  publicParams: Uint8Array;
  aclContractAddress: string;
  crsId?: string;
  [key: string]: any;
}

export type FhevmRelayerStatusType =
  | "sdk-loading"
  | "sdk-loaded"
  | "sdk-initializing"
  | "sdk-initialized"
  | "creating";

