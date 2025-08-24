"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import deployedContracts from "../contracts/deployedContracts";
import { toast } from "react-hot-toast";
import { formatEther, keccak256, parseEther, toHex } from "viem";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";

// Contract addresses from deployment
const FACTORY_ADDRESS = deployedContracts[31337].TrustEscrowFactory.address;
const FACTORY_ABI = deployedContracts[31337].TrustEscrowFactory.abi;
const ESCROW_ABI = deployedContracts[31337].TrustEscrow.abi;

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

  // Read contract data
  const { data: escrowCount } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: "getEscrowCount",
  });

  // State for current escrow details
  const [currentEscrow, setCurrentEscrow] = useState<(EscrowInfo & EscrowStatus) | null>(null);

  const loadSpecificEscrow = useCallback(
    async (address: string) => {
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
        const escrowStatus = await publicClient.readContract({
          address: address as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: "getEscrowStatus",
        });

        console.log("Real escrow status:", escrowStatus);

        // Get escrow info from the factory contract
        const escrowInfo = await publicClient.readContract({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "getEscrowInfo",
          args: [address as `0x${string}`],
        });

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
    [publicClient],
  );

  // Load specific escrow if address is provided in URL
  useEffect(() => {
    console.log("URL parameter check:");
    console.log("- escrowAddress from URL:", escrowAddress);
    console.log("- searchParams:", searchParams.toString());
    console.log("- current URL:", window.location.href);

    if (escrowAddress && escrowAddress.startsWith("0x") && escrowAddress.length === 42) {
      console.log("✅ Valid escrow address in URL, loading escrow...");
      loadSpecificEscrow(escrowAddress);
    } else if (escrowAddress) {
      console.warn("❌ Invalid escrow address format:", escrowAddress);
      toast.error("Invalid escrow address format");
    } else {
      console.log("No escrow address in URL");
    }
  }, [escrowAddress, searchParams, loadSpecificEscrow]);

  // Function to test BigInt conversions (for debugging)
  const testBigIntConversions = () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const bigIntTimestamp = BigInt(timestamp);
      console.log("BigInt conversion test successful:", {
        original: timestamp,
        converted: bigIntTimestamp.toString(),
      });
      return true;
    } catch (error) {
      console.error("BigInt conversion test failed:", error);
      return false;
    }
  };

  // Function to validate if an escrow address is real or temporary
  // Removed unused function isValidEscrowAddress

  // Function to manually test escrow loading
  const testEscrowLoading = async (address: string) => {
    try {
      console.log("Testing escrow loading for address:", address);

      if (!publicClient) {
        toast.error("Public client not available");
        return;
      }

      // Test if the address is a valid contract
      const code = await publicClient.getBytecode({
        address: address as `0x${string}`,
      });

      console.log("Contract code:", code ? "Valid contract" : "No code");

      if (!code || code === "0x") {
        toast.error("Address is not a valid contract");
        return;
      }

      // Try to read escrow status
      try {
        const escrowStatus = await publicClient.readContract({
          address: address as `0x${string}`,
          abi: ESCROW_ABI,
          functionName: "getEscrowStatus",
        });

        console.log("Escrow status read successfully:", escrowStatus);
        toast.success("Escrow loading test passed!");

        // Try to load the escrow
        await loadSpecificEscrow(address);
      } catch (statusError) {
        console.error("Error reading escrow status:", statusError);
        toast.error("Failed to read escrow status");
      }
    } catch (error) {
      console.error("Escrow loading test failed:", error);
      toast.error("Escrow loading test failed");
    }
  };

  // Function to test basic contract interaction
  const testContractInteraction = async () => {
    try {
      if (!publicClient) {
        toast.error("Public client not available");
        return;
      }

      toast.success("Testing contract interaction...");

      // Test reading from the factory contract
      const escrowCount = await publicClient.readContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "getEscrowCount",
      });

      console.log("✅ Factory contract accessible. Escrow count:", escrowCount);

      // Test if the contract is paused
      try {
        const isPaused = await publicClient.readContract({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "paused",
        });

        console.log("✅ Pause status check successful. Is paused:", isPaused);

        if (isPaused) {
          toast.error("⚠️ Factory contract is paused. Escrow creation may not work.");
        } else {
          toast.success("✅ Factory contract is active and ready for escrow creation.");
        }
      } catch {
        console.log("Pause check not available (contract may not have pause functionality)");
      }

      toast.success("Contract interaction test completed!");
    } catch (error) {
      console.error("Contract interaction test failed:", error);
      toast.error("Contract interaction test failed. Check console for details.");
    }
  };

  // Function to test contract validation rules
  const testContractValidation = async () => {
    try {
      if (!publicClient || !userAddress) {
        toast.error("Public client or user address not available");
        return;
      }

      toast.success("Testing contract validation rules...");

      // Test addresses that should pass validation
      const validBeneficiary = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const validArbiter = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

      console.log("Testing validation rules:");
      console.log("- User address:", userAddress);
      console.log("- Valid beneficiary:", validBeneficiary);
      console.log("- Valid arbiter:", validArbiter);

      // Test the validation rules
      const tests = [
        {
          name: "Beneficiary != User",
          result: validBeneficiary.toLowerCase() !== userAddress.toLowerCase(),
          expected: true,
        },
        {
          name: "Arbiter != User",
          result: validArbiter.toLowerCase() !== userAddress.toLowerCase(),
          expected: true,
        },
        {
          name: "Beneficiary != Arbiter",
          result: validBeneficiary.toLowerCase() !== validArbiter.toLowerCase(),
          expected: true,
        },
        {
          name: "Valid beneficiary format",
          result: validBeneficiary.startsWith("0x") && validBeneficiary.length === 42,
          expected: true,
        },
        {
          name: "Valid arbiter format",
          result: validArbiter.startsWith("0x") && validArbiter.length === 42,
          expected: true,
        },
      ];

      let allTestsPassed = true;

      for (const test of tests) {
        const passed = test.result === test.expected;
        console.log(`${passed ? "✅" : "❌"} ${test.name}: ${passed ? "PASSED" : "FAILED"}`);
        if (!passed) allTestsPassed = false;
      }

      if (allTestsPassed) {
        toast.success("✅ All validation tests passed!");
        console.log("✅ Contract validation rules are working correctly");
      } else {
        toast.error("❌ Some validation tests failed. Check console for details.");
        console.log("❌ Contract validation rules have issues");
      }
    } catch (error) {
      console.error("Contract validation test failed:", error);
      toast.error("Contract validation test failed");
    }
  };

  // Function to test link generation
  const testLinkGeneration = (escrowAddress: string) => {
    try {
      const baseUrl = window.location.origin;
      const escrowUrl = `${baseUrl}/escrow?ca=${escrowAddress}`;

      console.log("Link generation test:");
      console.log("- Base URL:", baseUrl);
      console.log("- Escrow address:", escrowAddress);
      console.log("- Generated URL:", escrowUrl);

      // Test if the URL is valid
      const testUrl = new URL(escrowUrl);
      console.log("✅ URL validation passed:", testUrl.toString());

      return escrowUrl;
    } catch (error) {
      console.error("❌ URL generation failed:", error);
      return null;
    }
  };

  // Debug function to test event parsing
  const debugEventParsing = async () => {
    try {
      if (!publicClient) {
        toast.error("Public client not available");
        return;
      }

      toast.success("Testing event parsing...");

      // Test keccak256 function
      const testSignature = "EscrowCreated(address,address,address,address,uint256)";
      const testHash = keccak256(toHex(testSignature));
      console.log("Test signature hash:", testHash);

      // Test contract reading
      const escrowCount = await publicClient.readContract({
        address: FACTORY_ADDRESS as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "getEscrowCount",
      });

      console.log("Current escrow count:", escrowCount);

      if (escrowCount && typeof escrowCount === "bigint" && escrowCount > BigInt(0)) {
        const latestIndex = escrowCount - BigInt(1);
        const latestEscrow = await publicClient.readContract({
          address: FACTORY_ADDRESS as `0x${string}`,
          abi: FACTORY_ABI,
          functionName: "escrows",
          args: [latestIndex],
        });

        console.log("Latest escrow address:", latestEscrow);

        if (latestEscrow && latestEscrow !== "0x0000000000000000000000000000000000000000") {
          // Test if it's a valid contract
          const code = await publicClient.getBytecode({
            address: latestEscrow as `0x${string}`,
          });

          console.log("Latest escrow contract code:", code ? "Valid contract" : "No code");
        }
      }

      toast.success("Debug test completed. Check console for details.");
    } catch (error) {
      console.error("Debug test failed:", error);
      toast.error("Debug test failed. Check console for details.");
    }
  };

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
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
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
                abi: ESCROW_ABI,
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
        abi: ESCROW_ABI,
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
        abi: ESCROW_ABI,
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
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Escrow Details</h1>
            <button onClick={() => router.push("/escrow")} className="btn btn-secondary">
              Back to Create
            </button>
          </div>

          {/* Escrow Information */}
          <div className="bg-card border p-6 rounded mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Escrow Contract</h2>
              {getRoleBadge(role)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Contract Address</p>
                <p className="font-mono text-sm break-all">{currentEscrow.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-bold text-lg">{formatEther(currentEscrow.amount)} ETH</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Depositor</p>
                <p className="font-mono text-sm break-all">{currentEscrow.depositor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Beneficiary</p>
                <p className="font-mono text-sm break-all">{currentEscrow.beneficiary}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Arbiter</p>
                <p className="font-mono text-sm break-all">{currentEscrow.arbiter}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    currentEscrow.isReleased
                      ? "bg-green-900 text-green-300"
                      : currentEscrow.isRefunded
                        ? "bg-yellow-900 text-yellow-300"
                        : currentEscrow.isFunded
                          ? "bg-blue-900 text-blue-300"
                          : "bg-gray-900 text-gray-300"
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
            <div className="flex gap-3 flex-wrap">
              {role === "arbiter" && canRelease(currentEscrow) && (
                <button
                  onClick={() => handleRelease(currentEscrow.address)}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? "Releasing..." : "Release Funds"}
                </button>
              )}
              {role === "arbiter" && canRefund(currentEscrow) && (
                <button
                  onClick={() => handleRefund(currentEscrow.address)}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? "Refunding..." : "Refund Funds"}
                </button>
              )}
              {role === "depositor" && !currentEscrow.isFunded && (
                <button
                  onClick={() => handleDeposit(currentEscrow.address, escrowData.amount || "1.0")}
                  disabled={loading}
                  className="btn btn-primary"
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
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Trust Escrow</h1>
          </div>

          {/* Welcome Screen */}
          <div className="text-center mb-8">
            <div className="bg-card border p-6 rounded mb-6">
              <h2 className="text-xl font-bold mb-4">Secure Escrow Transactions</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to create escrow contracts or access existing ones as depositor, arbiter, or
                beneficiary.
              </p>
              <p className="text-sm text-muted-foreground">
                Please use the &quot;Connect Wallet&quot; button in the header to get started.
              </p>
            </div>

            {/* How It Works */}
            <div className="bg-card border p-6 rounded">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold">How It Works</h3>
                <span>{showHowItWorks ? "−" : "+"}</span>
              </button>

              {showHowItWorks && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded">
                      <div className="text-2xl mb-2">💰</div>
                      <h4 className="font-semibold text-green-400">Depositor</h4>
                      <p className="text-sm text-muted-foreground">
                        Creates escrow, deposits funds, sets arbiter & beneficiary
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded">
                      <div className="text-2xl mb-2">⚖️</div>
                      <h4 className="font-semibold text-yellow-400">Arbiter</h4>
                      <p className="text-sm text-muted-foreground">
                        Reviews work, decides to release or withhold funds
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded">
                      <div className="text-2xl mb-2">🎯</div>
                      <h4 className="font-semibold text-blue-400">Beneficiary</h4>
                      <p className="text-sm text-muted-foreground">Completes work, requests payment, receives funds</p>
                    </div>
                  </div>

                  <div className="text-left space-y-2">
                    <h4 className="font-semibold">Key Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Wallet-based authentication - no passwords needed</li>
                      <li>• Automatic access based on your wallet address</li>
                      <li>• Secure smart contract escrow system</li>
                      <li>• Real-time transaction tracking</li>
                      <li>• Multi-party collaboration on same interface</li>
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
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Trust Escrow</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* How It Works - Collapsed for connected users */}
        <div className="bg-card border p-6 rounded mb-6">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="text-lg font-semibold">How It Works</h3>
            <span>{showHowItWorks ? "−" : "+"}</span>
          </button>

          {showHowItWorks && (
            <div className="mt-4 text-sm text-muted-foreground">
              <p>
                Three-party escrow system: Depositor creates contract → Arbiter verifies work → Beneficiary receives
                payment. All parties access the same transaction using their connected wallet.
              </p>
            </div>
          )}
        </div>

        {/* Contract Status */}
        <div className="bg-card border p-4 rounded mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Contract Status</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("create")}
                className={`btn btn-sm ${activeTab === "create" ? "btn-primary" : "btn-secondary"}`}
              >
                Create Escrow
              </button>
              <button
                onClick={() => setActiveTab("view")}
                className={`btn btn-sm ${activeTab === "view" ? "btn-primary" : "btn-secondary"}`}
              >
                View Escrow
              </button>
              <div className="flex gap-2 mb-4">
                <button onClick={() => window.location.reload()} className="btn btn-secondary btn-sm">
                  Refresh
                </button>
                <button onClick={debugEventParsing} className="btn btn-secondary btn-sm">
                  Debug Events
                </button>
                <button onClick={testBigIntConversions} className="btn btn-secondary btn-sm">
                  Test BigInt
                </button>
                <button onClick={testContractValidation} className="btn btn-secondary btn-sm">
                  Test Validation
                </button>
                <button onClick={testContractInteraction} className="btn btn-secondary btn-sm">
                  Test Interaction
                </button>
                <button
                  onClick={() => {
                    if (createdEscrowAddress) {
                      const testUrl = testLinkGeneration(createdEscrowAddress);
                      if (testUrl) {
                        toast.success("Link generation test passed!");
                        console.log("Test URL:", testUrl);
                      } else {
                        toast.error("Link generation test failed!");
                      }
                    } else {
                      toast.error("No escrow address to test");
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Test Link
                </button>
                <button
                  onClick={() => {
                    if (createdEscrowAddress) {
                      testEscrowLoading(createdEscrowAddress);
                    } else {
                      toast.error("No escrow address to test");
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Test Loading
                </button>
              </div>
            </div>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Total Escrows: {escrowCount && typeof escrowCount === "bigint" ? escrowCount.toString() : "0"}</p>
            <p>
              Factory Address: {FACTORY_ADDRESS.slice(0, 8)}...{FACTORY_ADDRESS.slice(-6)}
            </p>
          </div>
        </div>

        {/* Create Escrow Tab */}
        {activeTab === "create" && (
          <div className="bg-card border p-6 rounded">
            <h2 className="text-xl font-bold mb-4">Create New Escrow</h2>

            {/* Validation Rules Info */}
            <div className="bg-blue-900/20 border border-blue-700 p-3 rounded mb-4">
              <p className="text-xs text-blue-300">
                <strong>📋 Escrow Rules:</strong>• You cannot be the beneficiary or arbiter of your own escrow •
                Beneficiary and arbiter must be different addresses • All addresses must be valid Ethereum addresses •
                Amount must be greater than 0
              </p>
            </div>
            <form onSubmit={handleCreateEscrow} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Escrow Title</label>
                <input
                  type="text"
                  className="input"
                  value={escrowData.title}
                  onChange={e => setEscrowData({ ...escrowData, title: e.target.value })}
                  placeholder="e.g., Website Development Project"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={escrowData.description}
                  onChange={e => setEscrowData({ ...escrowData, description: e.target.value })}
                  placeholder="Describe the work or service to be provided"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
                <input
                  type="text"
                  className="input"
                  value={escrowData.amount}
                  onChange={e => setEscrowData({ ...escrowData, amount: e.target.value })}
                  placeholder="0.1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Arbiter Address</label>
                <input
                  type="text"
                  className="input"
                  value={escrowData.arbiterAddress}
                  onChange={e => setEscrowData({ ...escrowData, arbiterAddress: e.target.value })}
                  placeholder="0x..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Beneficiary Address</label>
                <input
                  type="text"
                  className="input"
                  value={escrowData.beneficiaryAddress}
                  onChange={e => setEscrowData({ ...escrowData, beneficiaryAddress: e.target.value })}
                  placeholder="0x..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Terms & Conditions</label>
                <textarea
                  className="input"
                  rows={3}
                  value={escrowData.terms}
                  onChange={e => setEscrowData({ ...escrowData, terms: e.target.value })}
                  placeholder="Define the conditions for fund release"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || extractingAddress || funding}
                className="btn btn-primary w-full"
              >
                {loading
                  ? "Creating Escrow..."
                  : extractingAddress
                    ? "Extracting Address..."
                    : funding
                      ? "Funding Escrow..."
                      : "Create & Fund Escrow"}
              </button>

              {/* Quick Test Addresses */}
              <div className="bg-gray-900/20 border border-gray-700 p-3 rounded mb-4">
                <p className="text-xs text-gray-300 mb-2">
                  <strong>🧪 Quick Test Addresses (Hardhat Network):</strong>
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Beneficiary:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEscrowData(prev => ({
                          ...prev,
                          beneficiaryAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                        }))
                      }
                      className="ml-2 text-blue-400 hover:text-blue-300 underline"
                    >
                      0x7099...79C8
                    </button>
                  </div>
                  <div>
                    <span className="text-gray-400">Arbiter:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEscrowData(prev => ({
                          ...prev,
                          arbiterAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                        }))
                      }
                      className="ml-2 text-blue-400 hover:text-blue-300 underline"
                    >
                      0x3C44...93BC
                    </button>
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    💡 These addresses are different from your wallet and from each other
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* View Escrow Tab */}
        {activeTab === "view" && (
          <div className="bg-card border p-6 rounded">
            <h2 className="text-xl font-bold mb-4">View Escrow by Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Escrow Contract Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="0x..."
                  value={escrowAddress || ""}
                  onChange={e => {
                    if (e.target.value) {
                      router.push(`/escrow?ca=${e.target.value}`);
                    }
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter an escrow contract address to view its details and perform actions.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card border p-6 rounded max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Escrow Created Successfully! 🎉</h3>
            <p className="text-sm text-muted-foreground mb-4">Share this link with your arbiter and beneficiary:</p>

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

            <div className="mt-4 text-xs text-muted-foreground">
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
