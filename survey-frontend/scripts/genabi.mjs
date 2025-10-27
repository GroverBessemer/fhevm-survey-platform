import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const CONTRACTS = ["SurveyFactory", "Survey"];

// Path to hardhat template
const rel = "../fhevm-hardhat-template";

// Output directory
const outdir = path.resolve("./abi");

if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

const dir = path.resolve(rel);
const dirname = path.basename(dir);

const line =
  "\n===================================================================\n";

if (!fs.existsSync(dir)) {
  console.error(
    `${line}Unable to locate ${rel}. Expecting <root>/${dirname}${line}`
  );
  process.exit(1);
}

const deploymentsDir = path.join(dir, "deployments");

function deployOnHardhatNode() {
  if (process.platform === "win32") {
    // Not supported on Windows
    return;
  }
  try {
    execSync(`./deploy-hardhat-node.sh`, {
      cwd: path.resolve("./scripts"),
      stdio: "inherit",
    });
  } catch (e) {
    console.error(`${line}Script execution failed: ${e}${line}`);
    process.exit(1);
  }
}

function readDeployment(chainName, chainId, contractName, optional) {
  const chainDeploymentDir = path.join(deploymentsDir, chainName);

  if (!fs.existsSync(chainDeploymentDir) && chainId === 31337) {
    // Try to auto-deploy the contract on hardhat node!
    console.log(`Attempting to deploy ${contractName} on local hardhat node...`);
    // deployOnHardhatNode();
  }

  if (!fs.existsSync(chainDeploymentDir)) {
    console.error(
      `${line}Unable to locate '${chainDeploymentDir}' directory.\n\n1. Goto '${dirname}' directory\n2. Run 'npx hardhat deploy --network ${chainName}'.${line}`
    );
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const contractFile = path.join(chainDeploymentDir, `${contractName}.json`);
  
  if (!fs.existsSync(contractFile)) {
    console.error(`${line}Contract ${contractName}.json not found in ${chainDeploymentDir}${line}`);
    if (!optional) {
      process.exit(1);
    }
    return undefined;
  }

  const jsonString = fs.readFileSync(contractFile, "utf-8");
  const obj = JSON.parse(jsonString);
  obj.chainId = chainId;

  return obj;
}

function readArtifact(contractName) {
  // Try to read from artifacts/contracts
  const artifactPath = path.join(dir, "artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`);
  
  if (!fs.existsSync(artifactPath)) {
    console.error(`${line}Artifact not found: ${artifactPath}${line}`);
    return undefined;
  }

  const jsonString = fs.readFileSync(artifactPath, "utf-8");
  const obj = JSON.parse(jsonString);

  return obj;
}

// Generate ABI files for each contract
for (const CONTRACT_NAME of CONTRACTS) {
  console.log(`\nGenerating ABI for ${CONTRACT_NAME}...`);

  // Auto deployed on Linux/Mac (will fail on windows)
  const deployLocalhost = readDeployment("localhost", 31337, CONTRACT_NAME, true);

  // Sepolia is optional
  let deploySepolia = readDeployment("sepolia", 11155111, CONTRACT_NAME, true);
  
  // If no deployments found, try to read from artifacts (for contracts like Survey that are created by factories)
  let abiSource;
  if (!deployLocalhost && !deploySepolia) {
    console.log(`No deployments found for ${CONTRACT_NAME}, reading from artifacts...`);
    const artifact = readArtifact(CONTRACT_NAME);
    if (!artifact) {
      console.warn(`${line}No artifact found for ${CONTRACT_NAME}. Skipping...${line}`);
      continue;
    }
    abiSource = artifact;
  } else {
    // Use whichever deployment is available for ABI
    abiSource = deployLocalhost || deploySepolia;

    if (deployLocalhost && deploySepolia) {
      if (
        JSON.stringify(deployLocalhost.abi) !== JSON.stringify(deploySepolia.abi)
      ) {
        console.error(
          `${line}Deployments on localhost and Sepolia differ for ${CONTRACT_NAME}. Consider re-deploying the contracts on both networks.${line}`
        );
      }
    }
  }

  const tsCode = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi: abiSource.abi }, null, 2)} as const;
`;

  const localhostAddress = deployLocalhost?.address || "0x0000000000000000000000000000000000000000";
  const sepoliaAddress = deploySepolia?.address || "0x0000000000000000000000000000000000000000";

  // Only generate addresses file if we have deployments
  if (deployLocalhost || deploySepolia) {
    const tsAddresses = `/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const ${CONTRACT_NAME}Addresses = { 
  "11155111": { address: "${sepoliaAddress}", chainId: 11155111, chainName: "sepolia" },
  "31337": { address: "${localhostAddress}", chainId: 31337, chainName: "hardhat" },
} as const;
`;

    console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}Addresses.ts`)}`);
    fs.writeFileSync(
      path.join(outdir, `${CONTRACT_NAME}Addresses.ts`),
      tsAddresses,
      "utf-8"
    );
  }

  console.log(`Generated ${path.join(outdir, `${CONTRACT_NAME}ABI.ts`)}`);
  fs.writeFileSync(path.join(outdir, `${CONTRACT_NAME}ABI.ts`), tsCode, "utf-8");
}

console.log("\n✅ ABI generation complete!\n");

