import { JsonRpcProvider } from "ethers";

const HARDHAT_NODE_URL = "http://localhost:8545";

async function checkHardhatNode() {
  try {
    const provider = new JsonRpcProvider(HARDHAT_NODE_URL);
    const version = await provider.send("web3_clientVersion", []);
    
    if (typeof version === "string" && version.toLowerCase().includes("hardhat")) {
      console.log("✅ Hardhat node is running");
      process.exit(0);
    } else {
      console.error("❌ Node at localhost:8545 is not a Hardhat node");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Hardhat node is not running at localhost:8545");
    console.error("\nPlease start the Hardhat node first:");
    console.error("  cd fhevm-hardhat-template");
    console.error("  npx hardhat node\n");
    process.exit(1);
  }
}

checkHardhatNode();

