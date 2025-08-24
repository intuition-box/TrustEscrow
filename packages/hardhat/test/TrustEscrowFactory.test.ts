import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { TrustEscrow, TrustEscrowFactory } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TrustEscrowFactory", function () {
  let trustEscrowFactory: TrustEscrowFactory;
  let trustEscrow: TrustEscrow;
  let factoryOwner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let user4: HardhatEthersSigner;

  beforeEach(async function () {
    [factoryOwner, user1, user2, user3, user4] = await ethers.getSigners();

    // Deploy TrustEscrow first
    const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
    trustEscrow = (await TrustEscrow.deploy(
      factoryOwner.address,
      user2.address,
      user3.address,
    )) as unknown as TrustEscrow;
    await trustEscrow.waitForDeployment();

    // Deploy TrustEscrowFactory
    const TrustEscrowFactory = await ethers.getContractFactory("TrustEscrowFactory");
    trustEscrowFactory = (await TrustEscrowFactory.deploy()) as unknown as TrustEscrowFactory;
    await trustEscrowFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct factory owner", async function () {
      expect(await trustEscrowFactory.owner()).to.equal(factoryOwner.address);
    });

    it("Should start with 0 escrows", async function () {
      expect(await trustEscrowFactory.getEscrowCount()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      expect(await trustEscrowFactory.paused()).to.equal(false);
    });
  });

  describe("Create Escrow", function () {
    it("Should create a new escrow successfully", async function () {
      const tx = await trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user3.address);
      await tx.wait();

      const escrowAddress = await trustEscrowFactory.escrows(0);

      await expect(tx).to.emit(trustEscrowFactory, "EscrowCreated");

      expect(await trustEscrowFactory.getEscrowCount()).to.equal(1);
      expect(escrowAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should store escrow information correctly", async function () {
      await trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user3.address);
      const escrowAddress = await trustEscrowFactory.escrows(0);

      const escrowInfo = await trustEscrowFactory.getEscrowInfo(escrowAddress);
      expect(escrowInfo.depositor).to.equal(user1.address);
      expect(escrowInfo.beneficiary).to.equal(user2.address);
      expect(escrowInfo.arbiter).to.equal(user3.address);
      expect(escrowInfo.exists).to.equal(true);
    });

    it("Should add escrow to user's escrows array", async function () {
      await trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user3.address);

      const userEscrows = await trustEscrowFactory.getUserEscrows(user1.address);
      expect(userEscrows.length).to.equal(1);
      expect(userEscrows[0]).to.equal(await trustEscrowFactory.escrows(0));
    });

    it("Should revert if beneficiary is zero address", async function () {
      await expect(
        trustEscrowFactory.connect(user1).createEscrowExternal(ethers.ZeroAddress, user3.address),
      ).to.be.revertedWithCustomError(trustEscrowFactory, "InvalidAddress");
    });

    it("Should revert if arbiter is zero address", async function () {
      await expect(
        trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(trustEscrowFactory, "InvalidAddress");
    });

    it("Should revert if beneficiary equals arbiter", async function () {
      await expect(
        trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user2.address),
      ).to.be.revertedWithCustomError(trustEscrowFactory, "InvalidAddress");
    });

    it("Should revert if depositor equals beneficiary", async function () {
      await expect(
        trustEscrowFactory.connect(user1).createEscrowExternal(user1.address, user3.address),
      ).to.be.revertedWithCustomError(trustEscrowFactory, "InvalidAddress");
    });

    it("Should revert if depositor equals arbiter", async function () {
      await expect(
        trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user1.address),
      ).to.be.revertedWithCustomError(trustEscrowFactory, "InvalidAddress");
    });
  });

  describe("Create Multiple Escrows", function () {
    it("Should create multiple escrows successfully", async function () {
      const beneficiaries = [user2.address, user3.address, user4.address];
      const arbiters = [user3.address, user4.address, user2.address];

      const tx = trustEscrowFactory.connect(user1).createMultipleEscrows(beneficiaries, arbiters);

      await expect(tx).to.not.be.reverted;

      expect(await trustEscrowFactory.getEscrowCount()).to.equal(3);
      expect((await trustEscrowFactory.getUserEscrows(user1.address)).length).to.equal(3);
    });

    it("Should revert if arrays length mismatch", async function () {
      const beneficiaries = [user2.address, user3.address];
      const arbiters = [user3.address];

      await expect(
        trustEscrowFactory.connect(user1).createMultipleEscrows(beneficiaries, arbiters),
      ).to.be.revertedWithCustomError(trustEscrowFactory, "ArraysLengthMismatch");
    });

    it("Should revert if arrays are empty", async function () {
      const beneficiaries: string[] = [];
      const arbiters: string[] = [];

      await expect(
        trustEscrowFactory.connect(user1).createMultipleEscrows(beneficiaries, arbiters),
      ).to.be.revertedWithCustomError(trustEscrowFactory, "EmptyArrays");
    });

    it("Should revert if too many escrows at once", async function () {
      const beneficiaries = Array(11).fill(user2.address);
      const arbiters = Array(11).fill(user3.address);

      await expect(
        trustEscrowFactory.connect(user1).createMultipleEscrows(beneficiaries, arbiters),
      ).to.be.revertedWithCustomError(trustEscrowFactory, "TooManyEscrows");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Create some escrows for testing
      await trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user3.address);
      await trustEscrowFactory.connect(user2).createEscrowExternal(user3.address, user4.address);
      await trustEscrowFactory.connect(user3).createEscrowExternal(user4.address, user1.address);
    });

    it("Should return correct escrow count", async function () {
      expect(await trustEscrowFactory.getEscrowCount()).to.equal(3);
    });

    it("Should return all escrows", async function () {
      const allEscrows = await trustEscrowFactory.getAllEscrows();
      expect(allEscrows.length).to.equal(3);
    });

    it("Should return user escrows correctly", async function () {
      const user1Escrows = await trustEscrowFactory.getUserEscrows(user1.address);
      const user2Escrows = await trustEscrowFactory.getUserEscrows(user2.address);
      const user3Escrows = await trustEscrowFactory.getUserEscrows(user3.address);

      expect(user1Escrows.length).to.equal(1);
      expect(user2Escrows.length).to.equal(1);
      expect(user3Escrows.length).to.equal(1);
    });

    it("Should validate escrow existence", async function () {
      const escrowAddress = await trustEscrowFactory.escrows(0);
      expect(await trustEscrowFactory.isValidEscrow(escrowAddress)).to.equal(true);
      expect(await trustEscrowFactory.isValidEscrow(ethers.ZeroAddress)).to.equal(false);
    });

    it("Should get escrow info correctly", async function () {
      const escrowAddress = await trustEscrowFactory.escrows(0);
      const escrowInfo = await trustEscrowFactory.getEscrowInfo(escrowAddress);

      expect(escrowInfo.depositor).to.equal(user1.address);
      expect(escrowInfo.beneficiary).to.equal(user2.address);
      expect(escrowInfo.arbiter).to.equal(user3.address);
    });

    it("Should revert when getting info for non-existent escrow", async function () {
      await expect(trustEscrowFactory.getEscrowInfo(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        trustEscrowFactory,
        "EscrowDoesNotExist",
      );
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause and unpause", async function () {
      await trustEscrowFactory.pause();
      expect(await trustEscrowFactory.paused()).to.equal(true);

      await expect(
        trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user3.address),
      ).to.be.revertedWithCustomError(trustEscrowFactory, "EnforcedPause");

      await trustEscrowFactory.unpause();
      expect(await trustEscrowFactory.paused()).to.equal(false);

      await expect(trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user3.address)).to.not.be
        .reverted;
    });

    it("Should revert if non-owner tries to pause", async function () {
      await expect(trustEscrowFactory.connect(user1).pause()).to.be.revertedWithCustomError(
        trustEscrowFactory,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should revert if non-owner tries to unpause", async function () {
      await trustEscrowFactory.pause();

      await expect(trustEscrowFactory.connect(user1).unpause()).to.be.revertedWithCustomError(
        trustEscrowFactory,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("Factory Statistics", function () {
    beforeEach(async function () {
      // Create escrows and fund some of them
      await trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user3.address);
      await trustEscrowFactory.connect(user2).createEscrowExternal(user3.address, user4.address);
      await trustEscrowFactory.connect(user3).createEscrowExternal(user4.address, user1.address);

      // Fund the first escrow
      const escrow1Address = await trustEscrowFactory.escrows(0);
      const escrow1 = await ethers.getContractAt("TrustEscrow", escrow1Address);
      await escrow1.connect(user1).deposit({ value: parseEther("0.1") });

      // Fund and release the second escrow
      const escrow2Address = await trustEscrowFactory.escrows(1);
      const escrow2 = await ethers.getContractAt("TrustEscrow", escrow2Address);
      await escrow2.connect(user2).deposit({ value: parseEther("0.1") });
      await escrow2.connect(user4).release();
    });

    it("Should return correct factory statistics", async function () {
      const stats = await trustEscrowFactory.getFactoryStats();

      expect(stats.totalEscrows).to.equal(3);
      expect(stats.totalFunded).to.equal(2);
      expect(stats.totalReleased).to.equal(1);
      expect(stats.totalRefunded).to.equal(0);
    });
  });

  describe("Integration with TrustEscrow", function () {
    it("Should create working escrow contracts", async function () {
      await trustEscrowFactory.connect(user1).createEscrowExternal(user2.address, user3.address);
      const escrowAddress = await trustEscrowFactory.escrows(0);

      const escrow = await ethers.getContractAt("TrustEscrow", escrowAddress);

      // Test that the escrow works correctly
      expect(await escrow.depositor()).to.equal(user1.address);
      expect(await escrow.beneficiary()).to.equal(user2.address);
      expect(await escrow.arbiter()).to.equal(user3.address);

      // Test deposit functionality
      await escrow.connect(user1).deposit({ value: parseEther("0.1") });
      expect(await escrow.isFunded()).to.equal(true);
      expect(await escrow.amount()).to.equal(parseEther("0.1"));
    });
  });
});
