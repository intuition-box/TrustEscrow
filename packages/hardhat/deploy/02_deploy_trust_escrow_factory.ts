import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploy the TrustEscrowFactory contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  console.log("Deploying TrustEscrowFactory contract...");
  console.log("Deployer:", deployer);

  const trustEscrowFactory = await deploy("TrustEscrowFactory", {
    from: deployer,
    args: [],
    log: true,
    // gasLimit: 4000000,
  });

  console.log("TrustEscrowFactory deployed to:", trustEscrowFactory.address);
  console.log("TrustEscrowFactory deployed at block:", trustEscrowFactory.receipt?.blockNumber);

  // Verify the contract on Etherscan
  if (trustEscrowFactory.newlyDeployed) {
    console.log("Contract is newly deployed, verification may be needed");
  }
};

func.id = "deploy_trust_escrow_factory"; // id required to prevent reexecution
func.tags = ["TrustEscrowFactory"];
func.dependencies = ["deploy_trust_escrow"]; // Deploy after TrustEscrow

export default func;
