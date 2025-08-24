import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { TrustEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TrustEscrow", function () {
  let trustEscrow: TrustEscrow;
  let depositor: HardhatEthersSigner;
  let beneficiary: HardhatEthersSigner;
  let arbiter: HardhatEthersSigner;
  let otherAccount: HardhatEthersSigner;

  const escrowAmount = parseEther("1.0");

  beforeEach(async function () {
    [depositor, beneficiary, arbiter, otherAccount] = await ethers.getSigners();

    const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
    trustEscrow = (await TrustEscrow.deploy(
      depositor.address,
      beneficiary.address,
      arbiter.address,
    )) as unknown as TrustEscrow;
    await trustEscrow.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct initial state", async function () {
      expect(await trustEscrow.depositor()).to.equal(depositor.address);
      expect(await trustEscrow.beneficiary()).to.equal(beneficiary.address);
      expect(await trustEscrow.arbiter()).to.equal(arbiter.address);
      expect(await trustEscrow.amount()).to.equal(0);
      expect(await trustEscrow.isFunded()).to.equal(false);
      expect(await trustEscrow.isReleased()).to.equal(false);
      expect(await trustEscrow.isRefunded()).to.equal(false);
    });

    it("Should emit EscrowCreated event", async function () {
      const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
      const newEscrow = await TrustEscrow.deploy(depositor.address, beneficiary.address, arbiter.address);

      await expect(newEscrow.deploymentTransaction())
        .to.emit(newEscrow, "EscrowCreated")
        .withArgs(depositor.address, beneficiary.address, arbiter.address);
    });

    it("Should revert if beneficiary is zero address", async function () {
      const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
      await expect(
        TrustEscrow.deploy(depositor.address, ethers.ZeroAddress, arbiter.address),
      ).to.be.revertedWithCustomError(trustEscrow, "InvalidAddress");
    });

    it("Should revert if arbiter is zero address", async function () {
      const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
      await expect(
        TrustEscrow.deploy(depositor.address, beneficiary.address, ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(trustEscrow, "InvalidAddress");
    });

    it("Should revert if beneficiary equals arbiter", async function () {
      const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
      await expect(
        TrustEscrow.deploy(depositor.address, beneficiary.address, beneficiary.address),
      ).to.be.revertedWithCustomError(trustEscrow, "InvalidAddress");
    });
  });

  describe("Deposit", function () {
    it("Should allow depositor to fund the escrow", async function () {
      const tx = trustEscrow.connect(depositor).deposit({ value: escrowAmount });

      await expect(tx).to.emit(trustEscrow, "Deposited").withArgs(depositor.address, escrowAmount);

      expect(await trustEscrow.amount()).to.equal(escrowAmount);
      expect(await trustEscrow.isFunded()).to.equal(true);
      expect(await ethers.provider.getBalance(trustEscrow.target)).to.equal(escrowAmount);
    });

    it("Should revert if non-depositor tries to deposit", async function () {
      await expect(trustEscrow.connect(otherAccount).deposit({ value: escrowAmount })).to.be.revertedWithCustomError(
        trustEscrow,
        "OnlyDepositor",
      );
    });

    it("Should revert if already funded", async function () {
      await trustEscrow.connect(depositor).deposit({ value: escrowAmount });

      await expect(trustEscrow.connect(depositor).deposit({ value: escrowAmount })).to.be.revertedWithCustomError(
        trustEscrow,
        "AlreadyFunded",
      );
    });

    it("Should revert if deposit amount is zero", async function () {
      await expect(trustEscrow.connect(depositor).deposit({ value: 0 })).to.be.revertedWithCustomError(
        trustEscrow,
        "InvalidAmount",
      );
    });
  });

  describe("Release", function () {
    beforeEach(async function () {
      await trustEscrow.connect(depositor).deposit({ value: escrowAmount });
    });

    it("Should allow arbiter to release funds to beneficiary", async function () {
      const beneficiaryBalanceBefore = await ethers.provider.getBalance(beneficiary.address);

      const tx = trustEscrow.connect(arbiter).release();

      await expect(tx).to.emit(trustEscrow, "Released").withArgs(beneficiary.address, escrowAmount);

      expect(await trustEscrow.isReleased()).to.equal(true);
      expect(await trustEscrow.isRefunded()).to.equal(false);

      const beneficiaryBalanceAfter = await ethers.provider.getBalance(beneficiary.address);
      expect(beneficiaryBalanceAfter - beneficiaryBalanceBefore).to.equal(escrowAmount);
    });

    it("Should revert if non-arbiter tries to release", async function () {
      await expect(trustEscrow.connect(otherAccount).release()).to.be.revertedWithCustomError(
        trustEscrow,
        "OnlyArbiter",
      );
    });

    it("Should revert if not funded", async function () {
      const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
      const newEscrow = await TrustEscrow.deploy(depositor.address, beneficiary.address, arbiter.address);

      await expect(newEscrow.connect(arbiter).release()).to.be.revertedWithCustomError(newEscrow, "NotFunded");
    });

    it("Should revert if already released", async function () {
      await trustEscrow.connect(arbiter).release();

      await expect(trustEscrow.connect(arbiter).release()).to.be.revertedWithCustomError(
        trustEscrow,
        "AlreadyReleased",
      );
    });

    it("Should revert if already refunded", async function () {
      await trustEscrow.connect(arbiter).refund();

      await expect(trustEscrow.connect(arbiter).release()).to.be.revertedWithCustomError(
        trustEscrow,
        "AlreadyReleased",
      );
    });
  });

  describe("Refund", function () {
    beforeEach(async function () {
      await trustEscrow.connect(depositor).deposit({ value: escrowAmount });
    });

    it("Should allow arbiter to refund funds to depositor", async function () {
      const depositorBalanceBefore = await ethers.provider.getBalance(depositor.address);

      const tx = trustEscrow.connect(arbiter).refund();

      await expect(tx).to.emit(trustEscrow, "Refunded").withArgs(depositor.address, escrowAmount);

      expect(await trustEscrow.isRefunded()).to.equal(true);
      expect(await trustEscrow.isReleased()).to.equal(false);

      const depositorBalanceAfter = await ethers.provider.getBalance(depositor.address);
      expect(depositorBalanceAfter - depositorBalanceBefore).to.equal(escrowAmount);
    });

    it("Should revert if non-arbiter tries to refund", async function () {
      await expect(trustEscrow.connect(otherAccount).refund()).to.be.revertedWithCustomError(
        trustEscrow,
        "OnlyArbiter",
      );
    });

    it("Should revert if not funded", async function () {
      const TrustEscrow = await ethers.getContractFactory("TrustEscrow");
      const newEscrow = await TrustEscrow.deploy(depositor.address, beneficiary.address, arbiter.address);

      await expect(newEscrow.connect(arbiter).refund()).to.be.revertedWithCustomError(newEscrow, "NotFunded");
    });

    it("Should revert if already released", async function () {
      await trustEscrow.connect(arbiter).release();

      await expect(trustEscrow.connect(arbiter).refund()).to.be.revertedWithCustomError(trustEscrow, "AlreadyReleased");
    });

    it("Should revert if already refunded", async function () {
      await trustEscrow.connect(arbiter).refund();

      await expect(trustEscrow.connect(arbiter).refund()).to.be.revertedWithCustomError(trustEscrow, "AlreadyReleased");
    });
  });

  describe("Get Escrow Status", function () {
    it("Should return correct escrow status", async function () {
      const status = await trustEscrow.getEscrowStatus();

      expect(status[0]).to.equal(depositor.address);
      expect(status[1]).to.equal(beneficiary.address);
      expect(status[2]).to.equal(arbiter.address);
      expect(status[3]).to.equal(0);
      expect(status[4]).to.equal(false);
      expect(status[5]).to.equal(false);
      expect(status[6]).to.equal(false);
    });

    it("Should return updated status after funding", async function () {
      await trustEscrow.connect(depositor).deposit({ value: escrowAmount });

      const status = await trustEscrow.getEscrowStatus();
      expect(status[3]).to.equal(escrowAmount);
      expect(status[4]).to.equal(true);
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow owner to pause and unpause", async function () {
      await trustEscrow.pause();
      expect(await trustEscrow.paused()).to.equal(true);

      await trustEscrow.unpause();
      expect(await trustEscrow.paused()).to.equal(false);
    });

    it("Should revert if non-owner tries to pause", async function () {
      await expect(trustEscrow.connect(otherAccount).pause()).to.be.revertedWithCustomError(
        trustEscrow,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should revert if non-owner tries to unpause", async function () {
      await trustEscrow.pause();

      await expect(trustEscrow.connect(otherAccount).unpause()).to.be.revertedWithCustomError(
        trustEscrow,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should revert deposit when paused", async function () {
      await trustEscrow.pause();

      await expect(trustEscrow.connect(depositor).deposit({ value: escrowAmount })).to.be.revertedWithCustomError(
        trustEscrow,
        "EnforcedPause",
      );
    });
  });

  describe("Emergency Withdraw", function () {
    it("Should allow owner to emergency withdraw when paused", async function () {
      await trustEscrow.connect(depositor).deposit({ value: escrowAmount });
      await trustEscrow.pause();

      const contractBalanceBefore = await ethers.provider.getBalance(trustEscrow.target);
      expect(contractBalanceBefore).to.equal(escrowAmount);

      await trustEscrow.emergencyWithdraw();

      const contractBalanceAfter = await ethers.provider.getBalance(trustEscrow.target);
      expect(contractBalanceAfter).to.equal(0);
    });

    it("Should revert emergency withdraw when not paused", async function () {
      await expect(trustEscrow.emergencyWithdraw()).to.be.revertedWithCustomError(trustEscrow, "ExpectedPause");
    });
  });

  describe("Receive Function", function () {
    it("Should allow depositor to send ETH directly", async function () {
      const tx = depositor.sendTransaction({
        to: trustEscrow.target,
        value: escrowAmount,
      });

      await expect(tx).to.emit(trustEscrow, "Deposited").withArgs(depositor.address, escrowAmount);
    });

    it("Should revert if non-depositor sends ETH directly", async function () {
      await expect(
        otherAccount.sendTransaction({
          to: trustEscrow.target,
          value: escrowAmount,
        }),
      ).to.be.revertedWithCustomError(trustEscrow, "OnlyDepositorCanSendETH");
    });
  });
});
