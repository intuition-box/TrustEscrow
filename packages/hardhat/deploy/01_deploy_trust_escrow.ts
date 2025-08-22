import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy the TrustEscrow contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  // Use hardcoded addresses for beneficiary and arbiter
  const beneficiary = "0xC8205f39a82B9bBEFE242750289e4833dB9cbFFB";
  const arbiter = "0x435FD035329C428F7c7323999DEF2c8D5caCac28";

  console.log("Deploying TrustEscrow contract...");
  console.log("Deployer:", deployer);
  console.log("Beneficiary:", beneficiary);
  console.log("Arbiter:", arbiter);

  const trustEscrow = await deploy("TrustEscrow", {
    from: deployer,
    args: [deployer, beneficiary, arbiter], // Add deployer as first argument
    log: true,
    // gasLimit: 4000000,
  });

  console.log("TrustEscrow deployed to:", trustEscrow.address);
  console.log("TrustEscrow deployed at block:", trustEscrow.receipt?.blockNumber);

  // Verify the contract on Etherscan
  if (trustEscrow.newlyDeployed) {
    console.log("Contract is newly deployed, verification may be needed");
  }
};

func.id = "deploy_trust_escrow"; // id required to prevent reexecution
func.tags = ["TrustEscrow"];

export default func;
