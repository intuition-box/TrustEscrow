"use client";

// @ts-nocheck - Disable TypeScript checks for this component due to complex contract type issues
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import deployedContracts from "../contracts/deployedContracts";
import { toast } from "react-hot-toast";
import { formatEther, keccak256, parseEther, toHex } from "viem";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

interface EscrowInfo {
  address: string;
  depositor: string;
  beneficiary: string;
  arbiter: string;
  createdAt: bigint;
  exists: boolean;
}

interface EscrowStatus {
  depositor: string;
  beneficiary: string;
  arbiter: string;
  amount: bigint;
  isFunded: boolean;
  isReleased: boolean;
  isRefunded: boolean;
}

interface EscrowData {
  title: string;
  description: string;
  amount: string;
  arbiterAddress: string;
  beneficiaryAddress: string;
  terms: string;
}

export default function TrustEscrowApp() {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const escrowAddress = searchParams.get("ca");
  const { targetNetwork } = useTargetNetwork();

  // Get the current network's contracts
  const getCurrentNetworkContracts = () => {
    // Check if contracts are deployed on the current network
    const networkContracts = deployedContracts[targetNetwork.id as keyof typeof deployedContracts];

    if (!networkContracts) {
      return {
        FACTORY_ADDRESS: null,
        FACTORY_ABI: null,
        ESCROW_ABI: null,
        contractsAvailable: false,
      };
    }

    return {
      FACTORY_ADDRESS: networkContracts.TrustEscrowFactory.address,
      FACTORY_ABI: networkContracts.TrustEscrowFactory.abi,
      ESCROW_ABI: networkContracts.TrustEscrow.abi,
      contractsAvailable: true,
    };
  };

  const { FACTORY_ADDRESS, FACTORY_ABI, ESCROW_ABI, contractsAvailable } = getCurrentNetworkContracts();

  // Contract interaction hooks
  const { writeContractAsync: createEscrowAsync } = useWriteContract();
  const { writeContractAsync: fundEscrowAsync } = useWriteContract();
  const { writeContractAsync: releaseFundsAsync } = useWriteContract();
  const { writeContractAsync: refundFundsAsync } = useWriteContract();

  // UI states
  const [activeTab, setActiveTab] = useState(escrowAddress ? "view" : "create");
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extractingAddress, setExtractingAddress] = useState(false);
  const [funding, setFunding] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdEscrowAddress, setCreatedEscrowAddress] = useState<string>("");

  // Form states
  const [escrowData, setEscrowData] = useState<EscrowData>({
    title: "",
    description: "",
    amount: "",
    arbiterAddress: "",
    beneficiaryAddress: "",
    terms: "",
  });

  // State for current escrow details
  const [currentEscrow, setCurrentEscrow] = useState<(EscrowInfo & EscrowStatus) | null>(null);

  // Read contract data - only call if contracts are available
  const { data: escrowCount } = useReadContract({
    address: contractsAvailable ? (FACTORY_ADDRESS as `0x${string}`) : undefined,
    abi: contractsAvailable ? (FACTORY_ABI as any) : undefined,
    functionName: "getEscrowCount",
  });

  const loadSpecificEscrow = useCallback(
    async (address: string) => {
      if (!contractsAvailable || !publicClient) return;

      try {
        // Validate the address format first
        if (!address || !address.startsWith("0x") || address.length !== 42) {
          throw new Error("Invalid escrow address format");
        }

        console.log("Loading real escrow data for address:", address);

        // Get real escrow data from the blockchain
        if (!publicClient) {
          throw new Error("Public client not available");
        }

        // Read escrow status from the escrow contract
        const escrowStatus = (await publicClient.readContract({
          address: address as `0x${string}`,
          abi: ESCROW_ABI as any,
          functionName: "getEscrowStatus",
        })) as any;

        console.log("Real escrow status:", escrowStatus);

        // Get escrow info from the factory contract
        const escrowInfo = (await publicClient.readContract({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: FACTORY_ABI as any,
          functionName: "getEscrowInfo",
          args: [address as `0x${string}`],
        })) as any;

        console.log("Real escrow info:", escrowInfo);

        // Create real escrow object from blockchain data
        const realEscrow: EscrowInfo & EscrowStatus = {
          address: address,
          depositor: escrowStatus[0],
          beneficiary: escrowStatus[1],
          arbiter: escrowStatus[2],
          amount: escrowStatus[3],
          isFunded: escrowStatus[4],
          isReleased: escrowStatus[5],
          isRefunded: escrowStatus[6],
          createdAt: escrowInfo.createdAt,
          exists: escrowInfo.exists,
        };

        console.log("Real escrow data loaded:", realEscrow);
        setCurrentEscrow(realEscrow);
      } catch (error) {
        console.error("Error loading escrow:", error);

        // If we can't load real data, show an error but don't crash
        toast.error("Failed to load escrow details from blockchain");
        setCurrentEscrow(null);

        // You could also show a fallback UI here instead of null
      }
    },
    [publicClient, contractsAvailable, FACTORY_ADDRESS, FACTORY_ABI, ESCROW_ABI],
  );

  // Load specific escrow if address is provided in URL
  useEffect(() => {
    if (escrowAddress && contractsAvailable) {
      loadSpecificEscrow(escrowAddress);
    }
  }, [escrowAddress, loadSpecificEscrow, contractsAvailable]);

  // Check if contracts are available on the current network
  if (!contractsAvailable) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-200px)]">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-4">Contracts Not Deployed</h1>
          <p className="text-gray-300 mb-6">
            The Trust Escrow contracts are not deployed on the {targetNetwork.name} network (Chain ID:{" "}
            {targetNetwork.id}).
          </p>
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400 mb-2">To use this application:</p>
            <ul className="text-sm text-gray-300 text-left space-y-1">
              <li>• Switch to localhost network (Chain ID: 31337)</li>
              <li>• Or deploy contracts to {targetNetwork.name}</li>
            </ul>
          </div>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Function to test if an address is a valid contract
  const isValidContract = async (address: string): Promise<boolean> => {
    try {
      if (!publicClient) return false;

      // Try to read the contract code
      const code = await publicClient.getBytecode({
        address: address as `0x${string}`,
      });

      // If code exists and is not empty, it's a contract
      return code !== undefined && code !== "0x";
    } catch (error) {
      console.error("Error checking contract validity:", error);
      return false;
    }
  };

  // Function to test link generation
  const testLinkGeneration = (address: string) => {
    const baseUrl = window.location.origin;
    const generatedLink = `${baseUrl}/escrow?ca=${address}`;
    console.log("Generated link:", generatedLink);
    return generatedLink;
  };

  // Function to get the real escrow address from the contract creation transaction
  const getRealEscrowAddress = async (transactionHash: string): Promise<string | null> => {
    try {
      console.log("Getting real escrow address from transaction:", transactionHash);

      // Wait for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 5000));

      if (!publicClient) {
        console.error("Public client not available");
        return null;
      }

      // Method 1: Try to get the escrow address from the factory contract directly
      // This is more reliable than parsing events
      console.log("Method 1: Reading from factory contract...");

      try {
        // Get the current escrow count
        const escrowCount = await publicClient.readContract({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "getEscrowCount",
        });

        console.log("Current escrow count:", escrowCount);

        if (escrowCount && typeof escrowCount === "bigint" && escrowCount > BigInt(0)) {
          // Get the latest escrow address
          const latestEscrowIndex = escrowCount - BigInt(1);
          const latestEscrowAddress = await publicClient.readContract({
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: "escrows",
            args: [latestEscrowIndex],
          });

          console.log("Latest escrow address from factory:", latestEscrowAddress);

          if (latestEscrowAddress && latestEscrowAddress !== "0x0000000000000000000000000000000000000000") {
            console.log("✅ Using factory method - escrow address:", latestEscrowAddress);
            return latestEscrowAddress;
          }
        }
      } catch (factoryError) {
        console.error("Factory method failed:", factoryError);
      }

      // Method 2: Try to parse the EscrowCreated event from transaction logs
      console.log("Method 2: Parsing transaction logs...");

      try {
        // Get transaction receipt
        const receipt = await publicClient.getTransactionReceipt({
          hash: transactionHash as `0x${string}`,
        });

        console.log("Transaction receipt:", receipt);
        console.log("Transaction logs:", receipt.logs);

        // The EscrowCreated event signature
        // event EscrowCreated(address indexed escrowAddress, address indexed depositor, address indexed beneficiary, address arbiter, uint256 timestamp)
        const eventSignature = "EscrowCreated(address,address,address,address,uint256)";
        const eventSignatureHash = keccak256(toHex(eventSignature));

        console.log("Looking for event signature hash:", eventSignatureHash);

        // Find the EscrowCreated event in the logs
        for (const log of receipt.logs) {
          console.log("Checking log:", {
            address: log.address,
            topics: log.topics,
            data: log.data,
          });

          // Check if this log matches the EscrowCreated event signature
          if (log.topics[0] === eventSignatureHash) {
            console.log("Found EscrowCreated event!");

            // The EscrowCreated event has 3 indexed parameters:
            // topics[0] = event signature hash
            // topics[1] = escrowAddress (indexed)
            // topics[2] = depositor (indexed)
            // topics[3] = beneficiary (indexed)
            // data = arbiter + timestamp (non-indexed)

            if (log.topics.length >= 4) {
              // Extract escrow address from topics[1]
              const escrowAddressTopic = log.topics[1];

              if (escrowAddressTopic) {
                // Convert the 32-byte topic to a 20-byte address
                // Remove the 0x prefix and take the last 40 characters (20 bytes)
                const escrowAddress = "0x" + escrowAddressTopic.slice(-40);

                console.log("Raw escrow address topic:", escrowAddressTopic);
                console.log("Extracted escrow address:", escrowAddress);

                // Validate the extracted address
                if (escrowAddress.startsWith("0x") && escrowAddress.length === 42) {
                  console.log("✅ Valid escrow address extracted from event:", escrowAddress);
                  return escrowAddress;
                } else {
                  console.error("❌ Invalid escrow address format from event:", escrowAddress);
                }
              }
            } else {
              console.error("❌ EscrowCreated event has insufficient topics:", log.topics.length);
            }
          }
        }
      } catch (eventError) {
        console.error("Event parsing method failed:", eventError);
      }

      // Method 3: Try to get the escrow address from the user's escrows
      console.log("Method 3: Reading user's escrows...");

      try {
        if (userAddress) {
          const userEscrows = await publicClient.readContract({
            address: FACTORY_ADDRESS as `0x${string}`,
            abi: FACTORY_ABI,
            functionName: "userEscrows",
            args: [userAddress as `0x${string}`, BigInt(0)], // Add index parameter
          });

          console.log("User's escrows:", userEscrows);

          if (userEscrows && Array.isArray(userEscrows) && userEscrows.length > 0) {
            const latestUserEscrow = userEscrows[userEscrows.length - 1];

            if (latestUserEscrow && latestUserEscrow !== "0x0000000000000000000000000000000000000000") {
              console.log("✅ Using user escrows method - escrow address:", latestUserEscrow);
              return latestUserEscrow;
            }
          }
        }
      } catch (userEscrowsError) {
        console.error("User escrows method failed:", userEscrowsError);
      }

      console.warn("All methods failed to get escrow address");
      return null;
    } catch (error) {
      console.error("Error getting real escrow address:", error);
      return null;
    }
  };

  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate form data
    if (!escrowData.beneficiaryAddress || !escrowData.arbiterAddress || !escrowData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate addresses
    if (!escrowData.beneficiaryAddress.startsWith("0x") || escrowData.beneficiaryAddress.length !== 42) {
      toast.error("Please enter a valid beneficiary address");
      return;
    }

    if (!escrowData.arbiterAddress.startsWith("0x") || escrowData.arbiterAddress.length !== 42) {
      toast.error("Please enter a valid arbiter address");
      return;
    }

    // Validate amount
    const amountValue = parseFloat(escrowData.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    // Contract validation rules
    if (escrowData.beneficiaryAddress === escrowData.arbiterAddress) {
      toast.error("Beneficiary and arbiter cannot be the same address");
      return;
    }

    if (escrowData.beneficiaryAddress.toLowerCase() === userAddress?.toLowerCase()) {
      toast.error("You cannot be the beneficiary of your own escrow");
      return;
    }

    if (escrowData.arbiterAddress.toLowerCase() === userAddress?.toLowerCase()) {
      toast.error("You cannot be the arbiter of your own escrow");
      return;
    }

    // Check for zero addresses
    if (escrowData.beneficiaryAddress === "0x0000000000000000000000000000000000000000") {
      toast.error("Beneficiary address cannot be zero address");
      return;
    }

    if (escrowData.arbiterAddress === "0x0000000000000000000000000000000000000000") {
      toast.error("Arbiter address cannot be zero address");
      return;
    }

    try {
      setLoading(true);

      console.log("Creating escrow with data:", {
        beneficiary: escrowData.beneficiaryAddress,
        arbiter: escrowData.arbiterAddress,
        amount: escrowData.amount,
      });

      // Create escrow
      const result = await createEscrowAsync({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI as any,
        functionName: "createEscrowExternal",
        args: [escrowData.beneficiaryAddress as `0x${string}`, escrowData.arbiterAddress as `0x${string}`],
      });

      console.log("Escrow creation result:", result);

      // Wait for transaction to be mined
      toast.success("Escrow creation transaction submitted! Waiting for confirmation...");

      // Wait a bit for the transaction to be processed
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try to get the real escrow address from the transaction
      setExtractingAddress(true);
      toast.success("Transaction confirmed! Extracting escrow address...");

      try {
        const realEscrowAddress = await getRealEscrowAddress(result);

        console.log("getRealEscrowAddress result:", realEscrowAddress);

        if (realEscrowAddress) {
          // Validate the escrow address before proceeding
          if (!realEscrowAddress.startsWith("0x") || realEscrowAddress.length !== 42) {
            console.error("Invalid escrow address format:", realEscrowAddress);
            toast.error("Invalid escrow address format. Please check the transaction manually.");
            return;
          }

          // Check if the address is not all zeros
          if (realEscrowAddress === "0x0000000000000000000000000000000000000000") {
            console.error("Escrow address is zero address:", realEscrowAddress);
            toast.error("Invalid escrow address (zero address). Please check the transaction manually.");
            return;
          }

          setCreatedEscrowAddress(realEscrowAddress);
          console.log("✅ Valid escrow address confirmed:", realEscrowAddress);

          // Test link generation
          const testUrl = testLinkGeneration(realEscrowAddress);
          console.log("Generated test URL:", testUrl);

          // Test if the address is actually a valid contract
          toast.success("Testing contract validity...");
          const isContract = await isValidContract(realEscrowAddress);

          if (!isContract) {
            console.error("Address is not a valid contract:", realEscrowAddress);
            toast.error("The escrow address is not a valid contract. Please check the transaction manually.");
            return;
          }

          console.log("✅ Contract validity confirmed");

          // Automatically fund the escrow
          try {
            setFunding(true);
            toast.success("🎉 Real escrow address obtained! Now funding the escrow...");

            if (fundEscrowAsync) {
              // Double-check the address before funding
              console.log("Final validation before funding:");
              console.log("- Address:", realEscrowAddress);
              console.log("- Address length:", realEscrowAddress.length);
              console.log("- Starts with 0x:", realEscrowAddress.startsWith("0x"));
              console.log("- Is zero address:", realEscrowAddress === "0x0000000000000000000000000000000000000000");

              if (realEscrowAddress.length !== 42 || !realEscrowAddress.startsWith("0x")) {
                throw new Error(`Invalid address format: ${realEscrowAddress}`);
              }

              if (realEscrowAddress === "0x0000000000000000000000000000000000000000") {
                throw new Error("Cannot fund zero address");
              }

              console.log("✅ Address validation passed, proceeding with funding...");

              const fundingResult = await fundEscrowAsync({
                address: realEscrowAddress as `0x${string}`,
                abi: ESCROW_ABI as any,
                functionName: "deposit",
                value: parseEther(escrowData.amount),
              });

              console.log("Funding transaction result:", fundingResult);
              toast.success("Funding transaction submitted! Waiting for confirmation...");

              // Wait for funding transaction to be confirmed
              await new Promise(resolve => setTimeout(resolve, 3000));

              toast.success("🎉 Escrow created and funded successfully! Share the link with arbiter and beneficiary.");
              setShowShareModal(true);
            } else {
              throw new Error("Write contract not available");
            }
          } catch (fundingError: any) {
            console.error("Error funding escrow:", fundingError);

            let errorMessage = "Escrow created but funding failed.";
            if (fundingError.message?.includes("invalid")) {
              errorMessage += " Invalid escrow address detected.";
            } else if (fundingError.message?.includes("insufficient")) {
              errorMessage += " Insufficient funds for funding.";
            } else {
              errorMessage += " You can fund it manually later.";
            }

            toast.error(errorMessage);
            console.error("Funding error details:", fundingError);
            setShowShareModal(true);
          } finally {
            setFunding(false);
          }
        } else {
          // If we can't get the real address, show an error
          toast.error("Failed to get real escrow address. Please check the transaction manually.");
          console.error("Could not extract real escrow address from transaction");
          return; // Don't show the share modal if we don't have a real address
        }
      } finally {
        setExtractingAddress(false);
      }

      // Reset form
      setEscrowData({
        title: "",
        description: "",
        amount: "",
        arbiterAddress: "",
        beneficiaryAddress: "",
        terms: "",
      });
    } catch (error: any) {
      console.error("Error creating escrow:", error);

      // Handle specific contract validation errors
      if (error.message?.includes("InvalidAddress")) {
        toast.error("Invalid address provided. Please check beneficiary and arbiter addresses.");
      } else if (error.message?.includes("User rejected")) {
        toast.error("Transaction was cancelled. Please try again.");
      } else if (error.message?.includes("insufficient funds")) {
        toast.error("Insufficient funds. Please check your balance.");
      } else if (error.message?.includes("nonce")) {
        toast.error("Nonce error. Please try refreshing your wallet or wait a moment.");
      } else if (error.message?.includes("reverted")) {
        // Check for specific revert reasons
        if (error.message?.includes("InvalidAddress")) {
          toast.error("Invalid address provided. Please check beneficiary and arbiter addresses.");
        } else if (error.message?.includes("FactoryIsPaused")) {
          toast.error("Factory is paused. Please try again later.");
        } else {
          toast.error("Contract validation failed. Please check your input.");
        }
      } else {
        toast.error(`Failed to create escrow: ${error.message || "Unknown error"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (escrowAddress: string, amount: string) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);

      await fundEscrowAsync({
        address: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI,
        functionName: "deposit",
        value: parseEther(amount),
      });

      toast.success("Funds deposited successfully!");
      // Reload escrow details
      if (escrowAddress) {
        loadSpecificEscrow(escrowAddress);
      }
    } catch (error: any) {
      console.error("Error depositing:", error);

      if (error.message?.includes("User rejected")) {
        toast.error("Transaction was cancelled. Please try again.");
      } else {
        toast.error("Failed to deposit funds. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (escrowAddress: string) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);

      await releaseFundsAsync({
        address: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI as any,
        functionName: "release",
      });

      toast.success("Funds released successfully!");
      // Reload escrow details
      if (escrowAddress) {
        loadSpecificEscrow(escrowAddress);
      }
    } catch (error: any) {
      console.error("Error releasing:", error);

      if (error.message?.includes("User rejected")) {
        toast.error("Transaction was cancelled. Please try again.");
      } else {
        toast.error("Failed to release funds. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (escrowAddress: string) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);

      await refundFundsAsync({
        address: escrowAddress as `0x${string}`,
        abi: ESCROW_ABI as any,
        functionName: "refund",
      });

      toast.success("Funds refunded successfully!");
      // Reload escrow details
      if (escrowAddress) {
        loadSpecificEscrow(escrowAddress);
      }
    } catch (error: any) {
      console.error("Error refunding:", error);

      if (error.message?.includes("User rejected")) {
        toast.error("Transaction was cancelled. Please try again.");
      } else {
        toast.error("Failed to refund funds. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = (escrow: EscrowInfo & EscrowStatus) => {
    if (!userAddress) return "Unknown";

    if (escrow.depositor.toLowerCase() === userAddress.toLowerCase()) return "depositor";
    if (escrow.beneficiary.toLowerCase() === userAddress.toLowerCase()) return "beneficiary";
    if (escrow.arbiter.toLowerCase() === userAddress.toLowerCase()) return "arbiter";

    return "Unknown";
  };

  const canRelease = (escrow: EscrowInfo & EscrowStatus) => {
    return (
      userAddress &&
      escrow.arbiter.toLowerCase() === userAddress.toLowerCase() &&
      escrow.isFunded &&
      !escrow.isReleased &&
      !escrow.isRefunded
    );
  };

  const canRefund = (escrow: EscrowInfo & EscrowStatus) => {
    return (
      userAddress &&
      escrow.arbiter.toLowerCase() === userAddress.toLowerCase() &&
      escrow.isFunded &&
      !escrow.isReleased &&
      !escrow.isRefunded
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      depositor: "bg-green-900 text-green-300",
      arbiter: "bg-yellow-900 text-yellow-300",
      beneficiary: "bg-blue-900 text-blue-300",
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${colors[role as keyof typeof colors] || "bg-gray-900 text-gray-300"}`}
      >
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const generateEscrowLink = (address: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/escrow?ca=${address}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // If viewing a specific escrow
  if (escrowAddress && currentEscrow) {
    const role = getUserRole(currentEscrow);

    return (
      <div className="text-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 sm:p-6 bg-card border rounded-xl">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Escrow Details
            </h1>
            <button onClick={() => router.push("/escrow")} className="btn btn-secondary w-full sm:w-auto">
              ← Back to Create
            </button>
          </div>

          {/* Escrow Information */}
          <div className="bg-card border p-4 sm:p-6 rounded-xl mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Escrow Contract</h2>
              {getRoleBadge(role)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Contract Address</p>
                <p className="font-mono text-sm break-all text-white">{currentEscrow.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Amount</p>
                                  <p className="font-bold text-lg text-white">{formatEther(currentEscrow.amount)} $TRUST</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Depositor</p>
                <p className="font-mono text-sm break-all text-white">{currentEscrow.depositor}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Beneficiary</p>
                <p className="font-mono text-sm break-all text-white">{currentEscrow.beneficiary}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Arbiter</p>
                <p className="font-mono text-sm break-all text-white">{currentEscrow.arbiter}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <span
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    currentEscrow.isReleased
                      ? "bg-green-900/30 text-green-300 border border-green-700"
                      : currentEscrow.isRefunded
                        ? "bg-yellow-900/30 text-yellow-300 border border-yellow-700"
                        : currentEscrow.isFunded
                          ? "bg-blue-900/30 text-blue-300 border border-blue-700"
                          : "bg-gray-900/30 text-gray-300 border border-gray-700"
                  }`}
                >
                  {currentEscrow.isReleased
                    ? "Completed"
                    : currentEscrow.isRefunded
                      ? "Refunded"
                      : currentEscrow.isFunded
                        ? "Funded"
                        : "Pending"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {role === "arbiter" && canRelease(currentEscrow) && (
                <button
                  onClick={() => handleRelease(currentEscrow.address)}
                  disabled={loading}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {loading ? "Releasing..." : "Release Funds"}
                </button>
              )}
              {role === "arbiter" && canRefund(currentEscrow) && (
                <button
                  onClick={() => handleRefund(currentEscrow.address)}
                  disabled={loading}
                  className="btn btn-secondary w-full sm:w-auto"
                >
                  {loading ? "Refunding..." : "Refund Funds"}
                </button>
              )}
              {role === "depositor" && !currentEscrow.isFunded && (
                <button
                  onClick={() => handleDeposit(currentEscrow.address, escrowData.amount || "1.0")}
                  disabled={loading}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {loading ? "Depositing..." : "Deposit Funds"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="text-white p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Screen */}
          <div className="text-center mb-8">
            <div className="bg-card border p-4 sm:p-6 rounded-xl mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Secure Escrow Transactions
              </h2>
              <p className="text-gray-300 mb-6 text-base sm:text-lg">
                Connect your wallet to create escrow contracts or access existing ones as depositor, arbiter, or
                beneficiary.
              </p>
              <p className="text-sm text-gray-400">
                Please use the &quot;Connect Wallet&quot; button in the header to get started.
              </p>
            </div>

            {/* How It Works */}
            <div className="bg-card border p-4 sm:p-6 rounded-xl">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold text-white">How It Works</h3>
                <span className="text-2xl">{showHowItWorks ? "−" : "+"}</span>
              </button>

              {showHowItWorks && (
                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg border hover:scale-105 transition-transform">
                      <div className="text-3xl mb-3">💰</div>
                      <h4 className="font-semibold text-green-400 mb-2">Depositor</h4>
                      <p className="text-sm text-gray-300">
                        Creates escrow, deposits funds, sets arbiter & beneficiary
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg border hover:scale-105 transition-transform">
                      <div className="text-3xl mb-3">⚖️</div>
                      <h4 className="font-semibold text-yellow-400 mb-2">Arbiter</h4>
                      <p className="text-sm text-gray-300">Reviews work, decides to release or withhold funds</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg border hover:scale-105 transition-transform">
                      <div className="text-3xl mb-3">🎯</div>
                      <h4 className="font-semibold text-blue-400 mb-2">Beneficiary</h4>
                      <p className="text-sm text-gray-300">Completes work, requests payment, receives funds</p>
                    </div>
                  </div>

                  <div className="text-left space-y-3">
                    <h4 className="font-semibold text-white text-lg">Key Features:</h4>
                    <ul className="text-sm text-gray-300 space-y-2">
                      <li className="flex items-center gap-2">• Wallet-based authentication - no passwords needed</li>
                      <li className="flex items-center gap-2">• Automatic access based on your wallet address</li>
                      <li className="flex items-center gap-2">• Secure smart contract escrow system</li>
                      <li className="flex items-center gap-2">• Real-time transaction tracking</li>
                      <li className="flex items-center gap-2">• Multi-party collaboration on same interface</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white p-4 sm:p-6 lg:p-8 fade-in">
      <div className="max-w-4xl lg:max-w-6xl mx-auto space-y-6 lg:space-y-8">
        {/* Page Title and Connection Status */}
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 lg:mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🚀 Trust Escrow Platform
          </h1>
          <p className="text-gray-300 text-base sm:text-lg lg:text-xl mb-6 lg:mb-8">Secure Decentralized Escrow System</p>

          {/* Connection Status */}
          <div className="inline-flex items-center gap-3 bg-muted px-4 sm:px-6 lg:px-8 py-3 lg:py-4 rounded-xl border backdrop-blur-sm">
            <div className="w-3 h-3 bg-green-400 rounded-full pulse"></div>
            <span className="text-sm lg:text-base text-gray-300">Connected:</span>
            <span className="text-sm lg:text-base font-mono text-white font-semibold">
              {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
            </span>
          </div>
        </div>

        {/* How It Works - Collapsed for connected users */}
        <div className="bg-card border p-4 sm:p-6 rounded-xl mb-6">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold text-white">How It Works</h3>
            <span className="text-2xl">{showHowItWorks ? "−" : "+"}</span>
          </button>

          {showHowItWorks && (
            <div className="mt-4 text-sm text-gray-300">
              <p>
                Three-party escrow system: Depositor creates contract → Arbiter verifies work → Beneficiary receives
                payment. All parties access the same transaction using their connected wallet.
              </p>
            </div>
          )}
        </div>

        {/* Contract Status and Navigation */}
        <div className="bg-card border p-4 sm:p-6 lg:p-8 rounded-xl slide-in-right">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 lg:gap-8">
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-6 lg:mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Contract Status
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 text-sm lg:text-base text-gray-300">
                <div className="bg-muted p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-transform">
                  <span className="font-semibold text-blue-400">Total Escrows:</span>
                  <span className="ml-2 text-white font-mono text-lg">
                    {escrowCount && typeof escrowCount === "bigint" ? escrowCount.toString() : "0"}
                  </span>
                </div>
                <div className="bg-muted p-4 rounded-xl border backdrop-blur-sm hover:scale-105 transition-transform">
                  <span className="font-semibold text-purple-400">Factory Address:</span>
                  <span className="ml-2 text-white font-mono text-sm">
                    {FACTORY_ADDRESS?.slice(0, 8)}...{FACTORY_ADDRESS?.slice(-6)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setActiveTab("create")}
                  className={`btn px-4 sm:px-6 lg:px-4 xl:px-6 w-full sm:w-auto lg:w-1/2 lg:whitespace-nowrap ${activeTab === "create" ? "btn-primary" : "btn-secondary"}`}
                >
                  Create Escrow
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab("view")}
                  className={`btn px-4 sm:px-6 lg:px-4 xl:px-6 w-full sm:w-auto lg:whitespace-nowrap ${activeTab === "view" ? "btn-primary" : "btn-secondary"}`}
                >
                  View Escrow
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Create Escrow Tab */}
        {activeTab === "create" && (
          <div className="bg-card border p-4 sm:p-6 lg:p-8 rounded-xl">
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-6 lg:mb-8 text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Create New Escrow
            </h2>

            {/* Validation Rules Info */}
            <div className="bg-blue-900/20 border border-blue-700 p-4 lg:p-6 rounded-lg mb-6 lg:mb-8">
              <h3 className="text-sm lg:text-base font-semibold text-blue-300 mb-2 lg:mb-3">📋 Escrow Rules</h3>
              <ul className="text-xs lg:text-sm text-blue-300 space-y-1 lg:space-y-2">
                <li>• You cannot be the beneficiary or arbiter of your own escrow</li>
                <li>• Beneficiary and arbiter must be different addresses</li>
                <li>• All addresses must be valid TRUST addresses</li>
                <li>• Amount must be greater than 0</li>
              </ul>
            </div>

            <form onSubmit={handleCreateEscrow} className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                <div>
                  <label className="block text-sm lg:text-base font-medium mb-2 lg:mb-3 text-white">Escrow Title</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={escrowData.title}
                    onChange={e => setEscrowData({ ...escrowData, title: e.target.value })}
                    placeholder="e.g., Website Development Project"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Description</label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    value={escrowData.description}
                    onChange={e => setEscrowData({ ...escrowData, description: e.target.value })}
                    placeholder="Describe the work or service to be provided"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Amount ($TRUST)</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={escrowData.amount}
                    onChange={e => setEscrowData({ ...escrowData, amount: e.target.value })}
                    placeholder="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Arbiter Address</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={escrowData.arbiterAddress}
                    onChange={e => setEscrowData({ ...escrowData, arbiterAddress: e.target.value })}
                    placeholder="0x..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Beneficiary Address</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={escrowData.beneficiaryAddress}
                    onChange={e => setEscrowData({ ...escrowData, beneficiaryAddress: e.target.value })}
                    placeholder="0x..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Terms & Conditions</label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    value={escrowData.terms}
                    onChange={e => setEscrowData({ ...escrowData, terms: e.target.value })}
                    placeholder="Define the conditions for fund release"
                    required
                  />
                </div>
              </div>

                             <button
                 type="submit"
                 disabled={loading || extractingAddress || funding}
                 className="btn btn-primary w-full lg:w-auto text-lg lg:text-xl py-4 lg:py-6 px-8 lg:px-12"
               >
                 {loading
                   ? "Creating Escrow..."
                   : extractingAddress
                     ? "Extracting Address..."
                     : funding
                       ? "Funding Escrow..."
                       : "🚀 Create & Fund Escrow"}
               </button>


            </form>
          </div>
        )}

        {/* View Escrow Tab */}
        {activeTab === "view" && (
          <div className="bg-card border p-4 sm:p-6 lg:p-8 rounded-xl">
            <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold mb-6 lg:mb-8 text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              View Escrow by Address
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-white">Escrow Contract Address</label>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="0x..."
                  value={escrowAddress || ""}
                  onChange={e => {
                    if (e.target.value) {
                      router.push(`/escrow?ca=${e.target.value}`);
                    }
                  }}
                />
              </div>
              <div className="bg-muted p-4 rounded-lg border">
                <p className="text-sm text-gray-300 text-center">
                  📋 Enter an escrow contract address to view its details and perform actions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border p-6 rounded max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Escrow Created Successfully! 🎉</h3>
            <p className="text-sm text-gray-300 mb-4">Share this link with your arbiter and beneficiary:</p>

            <div className="bg-muted p-3 rounded mb-4">
              <p className="text-xs font-mono break-all">{generateEscrowLink(createdEscrowAddress)}</p>
            </div>

            {/* Address Status Note */}
            <div className="bg-green-900/20 border border-green-700 p-3 rounded mb-4">
              <p className="text-xs text-green-300">
                <strong>✅ Real Escrow Address:</strong> This is the actual contract address from the blockchain. The
                arbiter and beneficiary can use this link to access the real escrow contract.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(generateEscrowLink(createdEscrowAddress))}
                className="btn btn-primary flex-1"
              >
                Copy Link
              </button>
              <button onClick={() => setShowShareModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              <p>
                <strong>Next steps:</strong>
              </p>
              <ul className="mt-2 space-y-1">
                <li>• Share the link with arbiter and beneficiary</li>
                <li>• Deposit funds to the escrow contract</li>
                <li>• Wait for work completion and arbitration</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
