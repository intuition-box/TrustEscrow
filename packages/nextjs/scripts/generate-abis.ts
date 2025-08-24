#!/usr/bin/env tsx

/**
 * Script to generate contract ABIs for frontend use
 * Run this after deploying your contracts to get the latest ABIs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const HARDHAT_ARTIFACTS_DIR = join(__dirname, "../../../hardhat/artifacts/contracts");
const FRONTEND_ABI_DIR = join(__dirname, "../types/contracts");

interface ContractArtifact {
  abi: any[];
  contractName: string;
}

function generateAbiFile(contractName: string, abi: any[]) {
  const abiContent = `// Auto-generated ABI for ${contractName}
// Generated on: ${new Date().toISOString()}

export const ${contractName}ABI = ${JSON.stringify(abi, null, 2)} as const;

export type ${contractName}ABI = typeof ${contractName}ABI;
`;

  const outputPath = join(FRONTEND_ABI_DIR, `${contractName}.ts`);
  writeFileSync(outputPath, abiContent);
  console.log(`✅ Generated ABI for ${contractName} at ${outputPath}`);
}

function main() {
  try {
    console.log("🔍 Generating contract ABIs...");

    // Ensure output directory exists
    if (!existsSync(FRONTEND_ABI_DIR)) {
      mkdirSync(FRONTEND_ABI_DIR, { recursive: true });
    }

    // Generate ABI for TrustEscrow
    const trustEscrowPath = join(HARDHAT_ARTIFACTS_DIR, "TrustEscrow.sol/TrustEscrow.json");
    if (existsSync(trustEscrowPath)) {
      const trustEscrowArtifact: ContractArtifact = JSON.parse(readFileSync(trustEscrowPath, "utf8"));
      generateAbiFile("TrustEscrow", trustEscrowArtifact.abi);
    } else {
      console.log("⚠️  TrustEscrow artifact not found. Make sure to compile your contracts first.");
    }

    // Generate ABI for TrustEscrowFactory
    const factoryPath = join(HARDHAT_ARTIFACTS_DIR, "TrustEscrowFactory.sol/TrustEscrowFactory.json");
    if (existsSync(factoryPath)) {
      const factoryArtifact: ContractArtifact = JSON.parse(readFileSync(factoryPath, "utf8"));
      generateAbiFile("TrustEscrowFactory", factoryArtifact.abi);
    } else {
      console.log("⚠️  TrustEscrowFactory artifact not found. Make sure to compile your contracts first.");
    }

    console.log("🎉 ABI generation complete!");
    console.log("📝 Update your contract addresses in config/contracts.ts");
    console.log(
      '🔗 Import the ABIs in your components like: import { TrustEscrowABI } from "../types/contracts/TrustEscrow"',
    );
  } catch (error) {
    console.error("❌ Error generating ABIs:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
