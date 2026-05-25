// scripts/deploy.js
// Deploy CirclePay contracts to Arc Testnet
//
// Usage:
//   npx hardhat run scripts/deploy.js --network arc-testnet
//
// Required env vars:
//   DEPLOYER_PRIVATE_KEY  - deployer wallet private key
//   NEXT_PUBLIC_USDC_ADDRESS - USDC contract on Arc Testnet
//   TREASURY_WALLET_ADDRESS  - treasury wallet address

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  CirclePay NG — Contract Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(`📍 Network:   ${hre.network.name}`);
  console.log(`👛 Deployer:  ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance:   ${hre.ethers.formatUnits(balance, 6)} USDC\n`);

  // ─── USDC address ─────────────────────────────────────────────────────────
  let usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;

  // If no USDC address and we're on a local/test network, deploy MockUSDC
  if (!usdcAddress || usdcAddress === "0x...") {
    if (hre.network.name === "hardhat" || hre.network.name === "localhost") {
      console.log("🔧 Deploying MockUSDC for local testing...");
      const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
      const mockUsdc = await MockUSDC.deploy();
      await mockUsdc.waitForDeployment();
      usdcAddress = await mockUsdc.getAddress();
      console.log(`✅ MockUSDC deployed: ${usdcAddress}\n`);
    } else {
      throw new Error(
        "NEXT_PUBLIC_USDC_ADDRESS not set. Get the official USDC address from Circle for Arc Testnet."
      );
    }
  }

  console.log(`🪙 USDC:      ${usdcAddress}`);

  // ─── Treasury wallet ──────────────────────────────────────────────────────
  const treasury = process.env.TREASURY_WALLET_ADDRESS || deployer.address;
  console.log(`🏦 Treasury:  ${treasury}\n`);

  // ─── Deploy CirclePayStaking ─────────────────────────────────────────────────
  console.log("📦 Deploying CirclePayStaking...");
  const CirclePayStaking = await hre.ethers.getContractFactory("CirclePayStaking");
  const staking = await CirclePayStaking.deploy(usdcAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();

  console.log(`✅ CirclePayStaking:  ${stakingAddress}`);
  const stakingTx = staking.deploymentTransaction();
  console.log(`   Tx hash:        ${stakingTx?.hash}\n`);

  // ─── Deploy CirclePayPayment ─────────────────────────────────────────────────
  console.log("📦 Deploying CirclePayPayment...");
  const CirclePayPayment = await hre.ethers.getContractFactory("CirclePayPayment");
  const payment = await CirclePayPayment.deploy(usdcAddress, treasury);
  await payment.waitForDeployment();
  const paymentAddress = await payment.getAddress();

  console.log(`✅ CirclePayPayment:  ${paymentAddress}`);
  const paymentTx = payment.deploymentTransaction();
  console.log(`   Tx hash:        ${paymentTx?.hash}\n`);

  // ─── Fund staking reward pool (optional) ─────────────────────────────────
  // Uncomment if you want to fund the reward pool during deployment
  // const REWARD_POOL_AMOUNT = hre.ethers.parseUnits("1000", 6); // 1000 USDC
  // const IERC20 = await hre.ethers.getContractAt("MockUSDC", usdcAddress);
  // await IERC20.approve(stakingAddress, REWARD_POOL_AMOUNT);
  // await staking.fundRewardPool(REWARD_POOL_AMOUNT);
  // console.log(`💰 Funded reward pool with 1000 USDC`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ✅ Deployment Complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📋 Add these to your .env.local:\n");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log(`NEXT_PUBLIC_STAKING_CONTRACT=${stakingAddress}`);
  console.log(`NEXT_PUBLIC_PAYMENT_CONTRACT=${paymentAddress}`);
  console.log("");

  const explorerBase =
    process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc-testnet.io";
  console.log("🔍 Explorer links:");
  console.log(`   Staking:  ${explorerBase}/address/${stakingAddress}`);
  console.log(`   Payment:  ${explorerBase}/address/${paymentAddress}`);
  console.log("");

  // Verify contracts if on a real network with explorer API key
  if (
    hre.network.name !== "hardhat" &&
    hre.network.name !== "localhost" &&
    process.env.ARC_EXPLORER_API_KEY
  ) {
    console.log("🔍 Verifying contracts on explorer...");
    try {
      await hre.run("verify:verify", {
        address: stakingAddress,
        constructorArguments: [usdcAddress],
      });
      await hre.run("verify:verify", {
        address: paymentAddress,
        constructorArguments: [usdcAddress, treasury],
      });
      console.log("✅ Contracts verified!\n");
    } catch (e) {
      console.warn("⚠️  Verification failed (may already be verified):", e.message);
    }
  }

  return { stakingAddress, paymentAddress, usdcAddress };
}

main()
  .then((addresses) => {
    console.log("🚀 Done! Update your .env.local with the addresses above.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
