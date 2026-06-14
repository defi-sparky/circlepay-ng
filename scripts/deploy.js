// scripts/deploy.js
// Deploy CirclePay NG contracts to Arc Testnet
//
// Usage:
//   npm run deploy:testnet
//
// Required env vars:
//   DEPLOYER_PRIVATE_KEY         - deployer wallet private key
//   NEXT_PUBLIC_USDC_ADDRESS     - USDC contract on Arc Testnet
//   TREASURY_WALLET_ADDRESS      - treasury wallet address

import hre from "hardhat";

async function main() {
  const deployer = await ethers.provider.getSigner();

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  CirclePay NG — Contract Deployment");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(`📍 Network:   ${hre.network.name}`);
  console.log(`👛 Deployer:  ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance:   ${hre.ethers.formatUnits(balance, 6)} USDC\n`);

  // ─── USDC address ──────────────────────────────────────────────────────────
  let usdcAddress = process.env.NEXT_PUBLIC_USDC_ADDRESS;

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
        "NEXT_PUBLIC_USDC_ADDRESS not set. Use 0x3600000000000000000000000000000000000000 for Arc Testnet."
      );
    }
  }

  console.log(`🪙 USDC:      ${usdcAddress}`);

  // ─── Treasury wallet ────────────────────────────────────────────────────────
  const treasury = process.env.TREASURY_WALLET_ADDRESS || deployer.address;
  console.log(`🏦 Treasury:  ${treasury}\n`);

  // ─── Deploy ArcPayStaking ───────────────────────────────────────────────────
  console.log("📦 Deploying ArcPayStaking...");
  const ArcPayStaking = await hre.ethers.getContractFactory("ArcPayStaking");
  const staking = await ArcPayStaking.deploy(usdcAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  const stakingTx = staking.deploymentTransaction();
  console.log(`✅ ArcPayStaking:  ${stakingAddress}`);
  console.log(`   Tx hash:        ${stakingTx?.hash}\n`);

  // ─── Deploy ArcPayPayment ───────────────────────────────────────────────────
  console.log("📦 Deploying ArcPayPayment...");
  const ArcPayPayment = await hre.ethers.getContractFactory("ArcPayPayment");
  const payment = await ArcPayPayment.deploy(usdcAddress, treasury);
  await payment.waitForDeployment();
  const paymentAddress = await payment.getAddress();
  const paymentTx = payment.deploymentTransaction();
  console.log(`✅ ArcPayPayment:  ${paymentAddress}`);
  console.log(`   Tx hash:        ${paymentTx?.hash}\n`);

  // ─── Summary ────────────────────────────────────────────────────────────────
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  ✅ Deployment Complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📋 Add these to your .env.local:\n");
  console.log(`NEXT_PUBLIC_USDC_ADDRESS=${usdcAddress}`);
  console.log(`NEXT_PUBLIC_STAKING_CONTRACT=${stakingAddress}`);
  console.log(`NEXT_PUBLIC_PAYMENT_CONTRACT=${paymentAddress}`);
  console.log("");

  const explorerBase = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.arcscan.app";
  console.log("🔍 Explorer links:");
  console.log(`   Staking:  ${explorerBase}/address/${stakingAddress}`);
  console.log(`   Payment:  ${explorerBase}/address/${paymentAddress}`);
  console.log("");

  return { stakingAddress, paymentAddress, usdcAddress };
}

main()
  .then(() => {
    console.log("🚀 Done! Update your .env.local with the addresses above.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
