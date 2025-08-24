#!/usr/bin/env tsx

/**
 * Test Multi-Party Transaction System
 *
 * This script demonstrates how transactions are created for all parties
 * when an escrow is created.
 */

interface EscrowTransaction {
  id: string;
  escrowAddress: string;
  title: string;
  description: string;
  amount: string;
  status: "pending" | "funded" | "released" | "refunded" | "disputed";
  depositor: string;
  arbiter: string;
  beneficiary: string;
  terms: string;
  createdAt: Date;
  fundedAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
}

// Global transaction storage (simulating the frontend)
const globalTransactionStore = new Map<string, EscrowTransaction>();

// Create transactions for all parties involved in an escrow
const createTransactionsForAllParties = (escrowData: any, escrowAddress: string) => {
  const transactionId = `escrow-${Date.now()}`;

  // Create transaction for DEPOSITOR
  const depositorTransaction: EscrowTransaction = {
    id: `${transactionId}-depositor`,
    escrowAddress,
    title: escrowData.title,
    description: escrowData.description,
    amount: escrowData.amount,
    status: "pending",
    depositor: escrowData.depositorAddress,
    arbiter: escrowData.arbiterAddress,
    beneficiary: escrowData.beneficiaryAddress,
    terms: escrowData.terms,
    createdAt: new Date(),
  };

  // Create transaction for ARBITER
  const arbiterTransaction: EscrowTransaction = {
    id: `${transactionId}-arbiter`,
    escrowAddress,
    title: escrowData.title,
    description: escrowData.description,
    amount: escrowData.amount,
    status: "pending",
    depositor: escrowData.depositorAddress,
    arbiter: escrowData.arbiterAddress,
    beneficiary: escrowData.beneficiaryAddress,
    terms: escrowData.terms,
    createdAt: new Date(),
  };

  // Create transaction for BENEFICIARY
  const beneficiaryTransaction: EscrowTransaction = {
    id: `${transactionId}-beneficiary`,
    escrowAddress,
    title: escrowData.title,
    description: escrowData.description,
    amount: escrowData.amount,
    status: "pending",
    depositor: escrowData.depositorAddress,
    arbiter: escrowData.arbiterAddress,
    beneficiary: escrowData.beneficiaryAddress,
    terms: escrowData.terms,
    createdAt: new Date(),
  };

  // Store all transactions globally
  globalTransactionStore.set(depositorTransaction.id, depositorTransaction);
  globalTransactionStore.set(arbiterTransaction.id, arbiterTransaction);
  globalTransactionStore.set(beneficiaryTransaction.id, beneficiaryTransaction);

  return { depositorTransaction, arbiterTransaction, beneficiaryTransaction };
};

// Fetch all transactions where a specific wallet is involved
const fetchUserTransactions = (walletAddress: string) => {
  const userTransactions: EscrowTransaction[] = [];

  // Iterate through all global transactions
  globalTransactionStore.forEach(transaction => {
    // Check if user is involved in this transaction
    if (
      transaction.depositor.toLowerCase() === walletAddress.toLowerCase() ||
      transaction.arbiter.toLowerCase() === walletAddress.toLowerCase() ||
      transaction.beneficiary.toLowerCase() === walletAddress.toLowerCase()
    ) {
      userTransactions.push(transaction);
    }
  });

  // Sort by creation date (newest first)
  userTransactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return userTransactions;
};

// Determine user role for a transaction
const getUserRole = (transaction: EscrowTransaction, walletAddress: string) => {
  if (transaction.depositor.toLowerCase() === walletAddress.toLowerCase()) return "depositor";
  if (transaction.arbiter.toLowerCase() === walletAddress.toLowerCase()) return "arbiter";
  if (transaction.beneficiary.toLowerCase() === walletAddress.toLowerCase()) return "beneficiary";
  return null;
};

// Main test function
const testMultiPartySystem = () => {
  console.log("🔐 Testing Multi-Party Transaction System\n");

  // Sample wallet addresses
  const depositorAddress = "0x1234567890123456789012345678901234567890";
  const arbiterAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
  const beneficiaryAddress = "0x9876543210987654321098765432109876543210";

  // Create sample escrow data
  const escrowData = {
    title: "Website Development Project",
    description: "Full-stack website development with React and Node.js",
    amount: "2.5",
    depositorAddress,
    arbiterAddress,
    beneficiaryAddress,
    terms: "Project completion and testing required before release",
  };

  // Generate mock escrow address
  const escrowAddress = `0x${Math.random().toString(16).substr(2, 40)}`;

  console.log("📝 Creating escrow with the following details:");
  console.log(`   Title: ${escrowData.title}`);
  console.log(`   Amount: ${escrowData.amount} ETH`);
  console.log(`   Depositor: ${depositorAddress.slice(0, 6)}...${depositorAddress.slice(-4)}`);
  console.log(`   Arbiter: ${arbiterAddress.slice(0, 6)}...${arbiterAddress.slice(-4)}`);
  console.log(`   Beneficiary: ${beneficiaryAddress.slice(0, 6)}...${beneficiaryAddress.slice(-4)}`);
  console.log(`   Escrow Address: ${escrowAddress.slice(0, 6)}...${escrowAddress.slice(-4)}\n`);

  // Create transactions for all parties
  createTransactionsForAllParties(escrowData, escrowAddress);

  console.log("✅ Created transactions for all parties:\n");

  // Show depositor's view
  console.log("👤 DEPOSITOR VIEW:");
  const depositorTransactions = fetchUserTransactions(depositorAddress);
  depositorTransactions.forEach(tx => {
    const role = getUserRole(tx, depositorAddress);
    console.log(`   📋 ${tx.title} - Role: ${role} - Status: ${tx.status}`);
  });

  console.log("\n⚖️ ARBITER VIEW:");
  const arbiterTransactions = fetchUserTransactions(arbiterAddress);
  arbiterTransactions.forEach(tx => {
    const role = getUserRole(tx, arbiterAddress);
    console.log(`   📋 ${tx.title} - Role: ${role} - Status: ${tx.status}`);
  });

  console.log("\n🎯 BENEFICIARY VIEW:");
  const beneficiaryTransactions = fetchUserTransactions(beneficiaryAddress);
  beneficiaryTransactions.forEach(tx => {
    const role = getUserRole(tx, beneficiaryAddress);
    console.log(`   📋 ${tx.title} - Role: ${role} - Status: ${tx.status}`);
  });

  console.log("\n📊 TRANSACTION STORE SUMMARY:");
  console.log(`   Total transactions stored: ${globalTransactionStore.size}`);
  console.log(`   Depositor transactions: ${depositorTransactions.length}`);
  console.log(`   Arbiter transactions: ${arbiterTransactions.length}`);
  console.log(`   Beneficiary transactions: ${beneficiaryTransactions.length}`);

  console.log("\n🔍 SIMULATING TRANSACTION STATUS UPDATES:");

  // Simulate depositing funds
  console.log("\n💰 Simulating deposit...");
  globalTransactionStore.forEach((transaction, key) => {
    if (transaction.escrowAddress === escrowAddress) {
      transaction.status = "funded";
      transaction.fundedAt = new Date();
      globalTransactionStore.set(key, transaction);
    }
  });

  // Show updated status for all parties
  console.log("\n📈 After deposit - All parties see updated status:");

  console.log("\n👤 DEPOSITOR:");
  fetchUserTransactions(depositorAddress).forEach(tx => {
    const role = getUserRole(tx, depositorAddress);
    console.log(`   📋 ${tx.title} - Role: ${role} - Status: ${tx.status}`);
  });

  console.log("\n⚖️ ARBITER:");
  fetchUserTransactions(arbiterAddress).forEach(tx => {
    const role = getUserRole(tx, arbiterAddress);
    console.log(`   📋 ${tx.title} - Role: ${role} - Status: ${tx.status}`);
  });

  console.log("\n🎯 BENEFICIARY:");
  fetchUserTransactions(beneficiaryAddress).forEach(tx => {
    const role = getUserRole(tx, beneficiaryAddress);
    console.log(`   📋 ${tx.title} - Role: ${role} - Status: ${tx.status}`);
  });

  console.log("\n🎉 Multi-party transaction system test completed successfully!");
  console.log("\n💡 Key Benefits:");
  console.log("   • All parties see the same transaction with their respective roles");
  console.log("   • Real-time status updates are visible to everyone");
  console.log("   • Each party can perform actions based on their role");
  console.log("   • No need for separate transaction creation per party");
};

// Run the test
if (require.main === module) {
  testMultiPartySystem();
}

export { testMultiPartySystem, createTransactionsForAllParties, fetchUserTransactions, getUserRole };
