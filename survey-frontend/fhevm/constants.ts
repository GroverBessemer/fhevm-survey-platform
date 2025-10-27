export const SDK_CDN_URL =
  "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

export const NETWORK_CONFIG = {
  31337: {
    name: "Hardhat Local",
    chainId: 31337,
    rpcUrl: "http://localhost:8545",
    isMock: true,
  },
  11155111: {
    name: "Sepolia",
    chainId: 11155111,
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY || ""}`,
    isMock: false,
  },
} as const;

export const MOCK_CHAINS: Record<number, string> = {
  31337: "http://localhost:8545",
};

