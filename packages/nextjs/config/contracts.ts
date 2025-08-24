// Contract Configuration
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
      address: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      abi: "TrustEscrowFactory", // This will be imported from generated types
    },
    TrustEscrow: {
      // This is the implementation contract, not deployed directly
      address: "", // Not deployed directly
      abi: "TrustEscrow", // This will be imported from generated types
    },
  },

  // Default network to use
  defaultNetwork: "localhost",
};

// Helper function to get contract address for current network
export const getContractAddress = (contractName: keyof typeof CONTRACT_CONFIG.contracts) => {
  const contract = CONTRACT_CONFIG.contracts[contractName];
  if ("address" in contract) {
    return contract.address;
  }
  throw new Error(`Contract ${contractName} does not have an address`);
};

// Helper function to get network configuration
export const getNetworkConfig = (chainId?: number) => {
  const defaultNetwork = CONTRACT_CONFIG.defaultNetwork as keyof typeof CONTRACT_CONFIG.networks;
  const targetChainId = chainId || CONTRACT_CONFIG.networks[defaultNetwork].chainId;

  for (const network of Object.values(CONTRACT_CONFIG.networks)) {
    if (network.chainId === targetChainId) {
      return network;
    }
  }

  return CONTRACT_CONFIG.networks[defaultNetwork];
};
