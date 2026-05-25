// test/CirclePayStaking.test.js
// Unit tests for CirclePayStaking and CirclePayPayment contracts

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CirclePay Contracts", function () {
  let usdc, staking, payment;
  let owner, user1, user2, treasury;
  const ONE_USDC  = ethers.parseUnits("1", 6);
  const TEN_USDC  = ethers.parseUnits("10", 6);
  const THOU_USDC = ethers.parseUnits("1000", 6);

  beforeEach(async () => {
    [owner, user1, user2, treasury] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    // Deploy CirclePayStaking
    const CirclePayStaking = await ethers.getContractFactory("CirclePayStaking");
    staking = await CirclePayStaking.deploy(await usdc.getAddress());

    // Deploy CirclePayPayment
    const CirclePayPayment = await ethers.getContractFactory("CirclePayPayment");
    payment = await CirclePayPayment.deploy(
      await usdc.getAddress(),
      treasury.address
    );

    // Mint USDC to users and fund staking reward pool
    await usdc.mint(user1.address, THOU_USDC);
    await usdc.mint(user2.address, THOU_USDC);
    await usdc.mint(owner.address, THOU_USDC);

    // Fund reward pool with 500 USDC
    await usdc.connect(owner).approve(await staking.getAddress(), THOU_USDC);
    await staking.connect(owner).fundRewardPool(ethers.parseUnits("500", 6));
  });

  // ─── CirclePayStaking ────────────────────────────────────────────────────────

  describe("CirclePayStaking", () => {
    it("should allow staking USDC", async () => {
      await usdc.connect(user1).approve(await staking.getAddress(), TEN_USDC);
      await staking.connect(user1).stake(TEN_USDC);

      expect(await staking.stakedBalance(user1.address)).to.equal(TEN_USDC);
      expect(await staking.totalStaked()).to.equal(TEN_USDC);
    });

    it("should revert stake of 0", async () => {
      await expect(staking.connect(user1).stake(0)).to.be.revertedWith(
        "CirclePayStaking: amount must be > 0"
      );
    });

    it("should revert unstake of more than staked", async () => {
      await usdc.connect(user1).approve(await staking.getAddress(), TEN_USDC);
      await staking.connect(user1).stake(TEN_USDC);

      await expect(
        staking.connect(user1).unstake(TEN_USDC + 1n)
      ).to.be.revertedWith("CirclePayStaking: insufficient staked balance");
    });

    it("should accumulate rewards over time", async () => {
      await usdc.connect(user1).approve(await staking.getAddress(), TEN_USDC);
      await staking.connect(user1).stake(TEN_USDC);

      // Fast-forward 30 days
      await time.increase(30 * 24 * 60 * 60);

      const rewards = await staking.pendingRewards(user1.address);
      // 25% APY on 10 USDC for 30 days ≈ 0.20 USDC
      expect(rewards).to.be.gt(0n);
      expect(rewards).to.be.closeTo(
        ethers.parseUnits("0.205", 6),
        ethers.parseUnits("0.01", 6) // 0.01 USDC tolerance
      );
    });

    it("should pay out rewards on unstake", async () => {
      await usdc.connect(user1).approve(await staking.getAddress(), TEN_USDC);
      await staking.connect(user1).stake(TEN_USDC);

      const balanceBefore = await usdc.balanceOf(user1.address);

      // Fast-forward 365 days (1 year = 25% = 2.5 USDC on 10 USDC)
      await time.increase(365 * 24 * 60 * 60);
      await staking.connect(user1).unstake(TEN_USDC);

      const balanceAfter = await usdc.balanceOf(user1.address);
      const received = balanceAfter - balanceBefore;

      // Should receive ~10 USDC principal + ~2.5 USDC rewards
      expect(received).to.be.gt(ethers.parseUnits("12", 6));
    });

    it("should update APY (owner only)", async () => {
      await staking.setApy(3000); // 30%
      expect(await staking.APY()).to.equal(30n);
    });

    it("should revert APY > 100%", async () => {
      await expect(staking.setApy(10001)).to.be.revertedWith(
        "CirclePayStaking: APY cannot exceed 100%"
      );
    });

    it("should not let non-owner update APY", async () => {
      await expect(
        staking.connect(user1).setApy(5000)
      ).to.be.revertedWith("CirclePayStaking: not owner");
    });
  });

  // ─── CirclePayPayment ────────────────────────────────────────────────────────

  describe("CirclePayPayment", () => {
    const SERVICE_ID = ethers.keccak256(ethers.toUtf8Bytes("airtime-mtn"));
    const REF        = "ARC1234ABCD";

    it("should process a payment and emit ServicePaid", async () => {
      await usdc.connect(user1).approve(
        await payment.getAddress(), ONE_USDC
      );

      await expect(
        payment.connect(user1).payForService(ONE_USDC, SERVICE_ID, REF)
      )
        .to.emit(payment, "ServicePaid")
        .withArgs(
          user1.address,
          ONE_USDC,
          (ONE_USDC * 50n) / 10_000n, // 0.5% fee
          SERVICE_ID,
          REF,
          (v) => v !== ethers.ZeroHash // paymentId
        );
    });

    it("should forward net amount to treasury", async () => {
      const treasuryBefore = await usdc.balanceOf(treasury.address);

      await usdc.connect(user1).approve(await payment.getAddress(), ONE_USDC);
      await payment.connect(user1).payForService(ONE_USDC, SERVICE_ID, REF);

      const treasuryAfter = await usdc.balanceOf(treasury.address);
      const fee = (ONE_USDC * 50n) / 10_000n;

      expect(treasuryAfter - treasuryBefore).to.equal(ONE_USDC - fee);
    });

    it("should reject payment below minimum", async () => {
      await usdc.connect(user1).approve(await payment.getAddress(), 100n);
      await expect(
        payment.connect(user1).payForService(100n, SERVICE_ID, REF)
      ).to.be.revertedWith("CirclePayPayment: below minimum payment");
    });

    it("should allow admin to mark payment completed", async () => {
      await usdc.connect(user1).approve(await payment.getAddress(), ONE_USDC);
      const tx = await payment
        .connect(user1)
        .payForService(ONE_USDC, SERVICE_ID, REF);
      const receipt = await tx.wait();

      // Extract paymentId from event
      const event = receipt?.logs.find(
        (l) => l.topics[0] === payment.interface.getEvent("ServicePaid").topicHash
      );
      const decoded = payment.interface.parseLog(event);
      const paymentId = decoded.args.paymentId;

      await expect(payment.markCompleted(paymentId))
        .to.emit(payment, "PaymentCompleted")
        .withArgs(paymentId);
    });

    it("should allow refund by admin", async () => {
      await usdc.connect(user1).approve(await payment.getAddress(), ONE_USDC);
      const tx = await payment
        .connect(user1)
        .payForService(ONE_USDC, SERVICE_ID, REF);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (l) => l.topics[0] === payment.interface.getEvent("ServicePaid").topicHash
      );
      const decoded = payment.interface.parseLog(event);
      const paymentId = decoded.args.paymentId;

      const userBalBefore = await usdc.balanceOf(user1.address);

      // Fund contract for refund
      await usdc.mint(await payment.getAddress(), ONE_USDC);
      await payment.refundPayment(paymentId);

      const userBalAfter = await usdc.balanceOf(user1.address);
      const fee = (ONE_USDC * 50n) / 10_000n;
      expect(userBalAfter - userBalBefore).to.equal(ONE_USDC - fee);
    });
  });
});
