#!/usr/bin/env tsx

/**
 * Setup script for Trust Escrow integration
 * This script helps configure the integration and provides testing guidance
 */
import { existsSync, writeFileSync } from "fs";
import { join } from "path";

const CONFIG_PATH = join(__dirname, "../config/contracts.ts");
const COMPONENT_PATH = join(__dirname, "../components/TrustEscrowApp.tsx");

function checkSetup() {
  console.log("🔍 Checking Trust Escrow integration setup...\n");

  // Check if config file exists
  if (existsSync(CONFIG_PATH)) {
    console.log("✅ Config file exists");
  } else {
    console.log("❌ Config file missing");
  }

  // Check if component exists
  if (existsSync(COMPONENT_PATH)) {
    console.log("✅ TrustEscrowApp component exists");
  } else {
    console.log("❌ TrustEscrowApp component missing");
  }

  // Check if CSS exists
  const cssPath = join(__dirname, "../styles/trust-escrow.css");
  if (existsSync(cssPath)) {
    console.log("✅ Custom CSS exists");
  } else {
    console.log("❌ Custom CSS missing");
  }

  // Check if escrow page exists
  const pagePath = join(__dirname, "../app/escrow/page.tsx");
  if (existsSync(pagePath)) {
    console.log("✅ Escrow page exists");
  } else {
    console.log("❌ Escrow page missing");
  }

  console.log("\n📋 Next Steps:");
  console.log("1. Compile your Hardhat contracts: cd ../hardhat && npm run compile");
  console.log("2. Generate ABIs: bun run tsx scripts/generate-abis.ts");
  console.log("3. Deploy contracts: cd ../hardhat && npm run deploy");
  console.log("4. Update contract addresses in config/contracts.ts");
  console.log("5. Start your Next.js app: npm run dev");
  console.log("6. Visit /escrow to test the integration");
}

function updateConfig() {
  console.log("🔧 Updating contract configuration...\n");

  const configContent = `// Contract Configuration
// Update these addresses after deploying your contracts

export const CONTRACT_CONFIG = {
  // Network configuration
  networks: {
    localhost: {
      chainId: 31337,
      name: "Localhost",
      rpcUrl: "http://localhost:8545",
    },
    sepolia: {
      chainId: 11155111,
      name: "Sepolia",
      rpcUrl: "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
    },
    mainnet: {
      chainId: 1,
      name: "Ethereum Mainnet",
      rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
    },
  },

  // Contract addresses - UPDATE THESE AFTER DEPLOYMENT
  contracts: {
    TrustEscrowFactory: {
      // Replace with your deployed factory contract address
      address: "0x...", // TODO: Update this
      abi: "TrustEscrowFactory",
    },
    TrustEscrow: {
      // This is the implementation contract, not deployed directly
      abi: "TrustEscrow",
    },
  },

  // Default network to use
  defaultNetwork: "localhost",
};

// Helper function to get contract address for current network
export const getContractAddress = (contractName: keyof typeof CONTRACT_CONFIG.contracts) => {
  return CONTRACT_CONFIG.contracts[contractName].address;
};

// Helper function to get network configuration
export const getNetworkConfig = (chainId?: number) => {
  const targetChainId = chainId || CONTRACT_CONFIG.networks[CONTRACT_CONFIG.defaultNetwork].chainId;
  
  for (const network of Object.values(CONTRACT_CONFIG.networks)) {
    if (network.chainId === targetChainId) {
      return network;
    }
  }
  
  return CONTRACT_CONFIG.networks[CONTRACT_CONFIG.defaultNetwork];
};
`;

  writeFileSync(CONFIG_PATH, configContent);
  console.log("✅ Configuration file updated");
  console.log("📝 Remember to update the contract addresses after deployment");
}

function showHelp() {
  console.log(`
🚀 Trust Escrow Integration Setup

Usage:
  bun run tsx scripts/setup-escrow.ts [command]

Commands:
  check     Check current setup status
  update    Update configuration files
  help      Show this help message

Examples:
  bun run tsx scripts/setup-escrow.ts check
  bun run tsx scripts/setup-escrow.ts update

For more information, see TRUST_ESCROW_INTEGRATION.md
`);
}

function main() {
  const command = process.argv[2] || "check";

  switch (command) {
    case "check":
      checkSetup();
      break;
    case "update":
      updateConfig();
      break;
    case "help":
      showHelp();
      break;
    default:
      console.log(`❌ Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

if (require.main === module) {
  main();
}
