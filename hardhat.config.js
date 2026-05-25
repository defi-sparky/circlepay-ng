require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    // ─── Local testing ───────────────────────────────────────────────────────
    hardhat: {
      chainId: 31337,
    },

    // ─── Arc Testnet ──────────────────────────────────────────────────────────
    "arc-testnet": {
      url: process.env.NEXT_PUBLIC_ARC_RPC_URL || "https://rpc.arc-testnet.io",
      chainId: parseInt(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || "1234"),
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gasPrice: "auto",
    },

    // ─── Arc Mainnet (future) ─────────────────────────────────────────────────
    "arc-mainnet": {
      url: process.env.ARC_MAINNET_RPC || "https://rpc.arc.io",
      chainId: 9999,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
  },

  etherscan: {
    apiKey: {
      "arc-testnet": process.env.ARC_EXPLORER_API_KEY || "no-key",
    },
    customChains: [
      {
        network: "arc-testnet",
        chainId: parseInt(process.env.NEXT_PUBLIC_ARC_CHAIN_ID || "1234"),
        urls: {
          apiURL: `${process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc-testnet.io"}/api`,
          browserURL: process.env.NEXT_PUBLIC_EXPLORER_URL || "https://explorer.arc-testnet.io",
        },
      },
    ],
  },

  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
};
