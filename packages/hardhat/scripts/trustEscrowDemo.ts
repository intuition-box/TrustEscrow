import { ethers } from "hardhat";
import { parseEther } from "ethers";

async function main() {
  console.log("🚀 Starting TrustEscrow Demo...\n");

  // Get signers
  const [deployer, beneficiary, arbiter] = await ethers.getSigners();

  console.log("📋 Accounts:");
  console.log("Deployer:", deployer.address);
  console.log("Beneficiary:", beneficiary.address);
  console.log("Arbiter:", arbiter.address);
  console.log("");

  // Deploy the contract
  console.log("📦 Deploying TrustEscrow contract...");
  const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
  const trustEscrow = await TrustEscrow.deploy(deployer.address, beneficiary.address, arbiter.address);
  await trustEscrow.waitForDeployment();

  console.log("✅ TrustEscrow deployed to:", trustEscrow.target);
  console.log("");

  // Check initial state
  console.log("🔍 Initial Contract State:");
  const status = await trustEscrow.getEscrowStatus();
  console.log("Depositor:", status[0]);
  console.log("Beneficiary:", status[1]);
  console.log("Arbiter:", status[2]);
  console.log("Amount:", ethers.formatEther(status[3]), "ETH");
  console.log("Is Funded:", status[4]);
  console.log("Is Released:", status[5]);
  console.log("Is Refunded:", status[6]);
  console.log("");

  // Fund the escrow
  const escrowAmount = parseEther("0.1");
  console.log("💰 Funding escrow with", ethers.formatEther(escrowAmount), "ETH...");

  const depositTx = await trustEscrow.connect(deployer).deposit({ value: escrowAmount });
  await depositTx.wait();

  console.log("✅ Escrow funded successfully!");
  console.log("");

  // Check state after funding
  console.log("🔍 Contract State After Funding:");
  const statusAfterFunding = await trustEscrow.getEscrowStatus();
  console.log("Amount:", ethers.formatEther(statusAfterFunding[3]), "ETH");
  console.log("Is Funded:", statusAfterFunding[4]);
  console.log("Contract Balance:", ethers.formatEther(await ethers.provider.getBalance(trustEscrow.target)), "ETH");
  console.log("");

  // Simulate a dispute scenario - refund to depositor
  console.log("🔄 Simulating dispute resolution - refunding to depositor...");

  const refundTx = await trustEscrow.connect(arbiter).refund();
  await refundTx.wait();

  console.log("✅ Funds refunded to depositor!");
  console.log("");

  // Check final state
  console.log("🔍 Final Contract State:");
  const finalStatus = await trustEscrow.getEscrowStatus();
  console.log("Amount:", ethers.formatEther(finalStatus[3]), "ETH");
  console.log("Is Funded:", finalStatus[4]);
  console.log("Is Released:", finalStatus[5]);
  console.log("Is Refunded:", finalStatus[6]);
  console.log("Contract Balance:", ethers.formatEther(await ethers.provider.getBalance(trustEscrow.target)), "ETH");
  console.log("");

  // Check balances
  console.log("💰 Final Balances:");
  console.log("Deployer Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("Beneficiary Balance:", ethers.formatEther(await ethers.provider.getBalance(beneficiary.address)), "ETH");
  console.log("Arbiter Balance:", ethers.formatEther(await ethers.provider.getBalance(arbiter.address)), "ETH");
  console.log("");

  console.log("🎉 TrustEscrow Demo completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
