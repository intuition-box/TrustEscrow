import { ethers } from "hardhat";
import { parseEther } from "ethers";

async function main() {
  console.log("🚀 Starting TrustEscrowFactory Demo...\n");

  // Get signers
  const [deployer, beneficiary1, arbiter1, beneficiary2, arbiter2] = await ethers.getSigners();

  console.log("📋 Accounts:");
  console.log("Factory Deployer:", deployer.address);
  console.log("Beneficiary 1:", beneficiary1.address);
  console.log("Arbiter 1:", arbiter1.address);
  console.log("Beneficiary 2:", beneficiary2.address);
  console.log("Arbiter 2:", arbiter2.address);
  console.log("");

  // Deploy the factory
  console.log("🏭 Deploying TrustEscrowFactory contract...");
  const TrustEscrowFactory = await ethers.getContractFactory("TrustEscrowFactory");
  const factory = await TrustEscrowFactory.deploy();
  await factory.waitForDeployment();

  console.log("✅ TrustEscrowFactory deployed to:", factory.target);
  console.log("");

  // Check initial factory state
  console.log("🔍 Initial Factory State:");
  console.log("Total Escrows:", await factory.getEscrowCount());
  console.log("Factory Owner:", await factory.owner());
  console.log("Factory Paused:", await factory.paused());
  console.log("");

  // Create first escrow
  console.log("📦 Creating first escrow...");
  const tx1 = await factory.connect(deployer).createEscrowExternal(beneficiary1.address, arbiter1.address);
  await tx1.wait();

  const escrow1Address = await factory.escrows(0);
  console.log("✅ First escrow created at:", escrow1Address);
  console.log("");

  // Create second escrow
  console.log("📦 Creating second escrow...");
  const tx2 = await factory.connect(deployer).createEscrowExternal(beneficiary2.address, arbiter2.address);
  await tx2.wait();

  const escrow2Address = await factory.escrows(1);
  console.log("✅ Second escrow created at:", escrow2Address);
  console.log("");

  // Check factory state after creating escrows
  console.log("🔍 Factory State After Creating Escrows:");
  console.log("Total Escrows:", await factory.getEscrowCount());
  console.log("User Escrows Count:", (await factory.getUserEscrows(deployer.address)).length);
  console.log("");

  // Get escrow information
  console.log("📋 Escrow Information:");
  const escrow1Info = await factory.getEscrowInfo(escrow1Address);
  const escrow2Info = await factory.getEscrowInfo(escrow2Address);

  console.log("Escrow 1:");
  console.log("  Depositor:", escrow1Info.depositor);
  console.log("  Beneficiary:", escrow1Info.beneficiary);
  console.log("  Arbiter:", escrow1Info.arbiter);
  console.log("  Created At:", new Date(Number(escrow1Info.createdAt) * 1000).toISOString());
  console.log("");

  console.log("Escrow 2:");
  console.log("  Depositor:", escrow2Info.depositor);
  console.log("  Beneficiary:", escrow2Info.beneficiary);
  console.log("  Arbiter:", escrow2Info.arbiter);
  console.log("  Created At:", new Date(Number(escrow2Info.createdAt) * 1000).toISOString());
  console.log("");

  // Test multiple escrow creation
  console.log("📦 Creating multiple escrows at once...");
  const beneficiaries = [beneficiary1.address, beneficiary2.address];
  const arbiters = [arbiter1.address, arbiter2.address];

  const tx3 = await factory.connect(deployer).createMultipleEscrows(beneficiaries, arbiters);
  await tx3.wait();

  console.log("✅ Multiple escrows created successfully!");
  console.log("Total Escrows Now:", await factory.getEscrowCount());
  console.log("");

  // Get factory statistics
  console.log("📊 Factory Statistics:");
  const stats = await factory.getFactoryStats();
  console.log("Total Escrows:", stats.totalEscrows);
  console.log("Total Funded:", stats.totalFunded);
  console.log("Total Released:", stats.totalReleased);
  console.log("Total Refunded:", stats.totalRefunded);
  console.log("");

  // Test pause functionality
  console.log("⏸️ Testing pause functionality...");
  await factory.pause();
  console.log("✅ Factory paused");

  // Try to create escrow while paused (should fail)
  console.log("🚫 Attempting to create escrow while paused...");
  try {
    await factory.connect(deployer).createEscrowExternal(beneficiary1.address, arbiter1.address);
  } catch {
    console.log("✅ Correctly prevented escrow creation while paused");
  }

  // Unpause factory
  await factory.unpause();
  console.log("✅ Factory unpaused");
  console.log("");

  // Test escrow interaction
  console.log("💰 Testing escrow interaction...");
  const escrow1 = await ethers.getContractAt("TrustEscrow", escrow1Address);

  console.log("Depositing 0.1 ETH to first escrow...");
  const depositTx = await escrow1.connect(deployer).deposit({ value: parseEther("0.1") });
  await depositTx.wait();

  console.log("✅ Escrow funded successfully!");
  console.log("Escrow Amount:", ethers.formatEther(await escrow1.amount()), "ETH");
  console.log("Is Funded:", await escrow1.isFunded());
  console.log("");

  // Check updated factory statistics
  console.log("📊 Updated Factory Statistics:");
  const updatedStats = await factory.getFactoryStats();
  console.log("Total Escrows:", updatedStats.totalEscrows);
  console.log("Total Funded:", updatedStats.totalFunded);
  console.log("Total Released:", updatedStats.totalReleased);
  console.log("Total Refunded:", updatedStats.totalRefunded);
  console.log("");

  // Get escrows by status
  console.log("🔍 Escrows by Status:");
  const fundedEscrows = await factory.getEscrowsByStatus(1); // 1 = funded
  console.log("Funded Escrows:", fundedEscrows.length);

  const allEscrows = await factory.getEscrowsByStatus(0); // 0 = all
  console.log("All Escrows:", allEscrows.length);
  console.log("");

  console.log("🎉 TrustEscrowFactory Demo completed successfully!");
  console.log("");
  console.log("📝 Summary:");
  console.log("- Factory deployed at:", factory.target);
  console.log("- Total escrows created:", await factory.getEscrowCount());
  console.log("- Factory owner:", await factory.owner());
  console.log("- Factory is paused:", await factory.paused());
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
