// lib/contracts.ts
// Contract ABIs and addresses for CirclePay NG

export const CONTRACTS = {
  USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS || 
    "0x3600000000000000000000000000000000000000") as `0x${string}`,
  STAKING: process.env.NEXT_PUBLIC_STAKING_CONTRACT as `0x${string}`,
  PAYMENT: process.env.NEXT_PUBLIC_PAYMENT_CONTRACT as `0x${string}`,
  PAYMASTER: process.env.NEXT_PUBLIC_PAYMASTER_ADDRESS as `0x${string}`,
} as const;

// ─── ERC-20 USDC ABI (minimal) ───────────────────────────────────────────────
export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── Staking Contract ABI ────────────────────────────────────────────────────
export const STAKING_ABI = [
  {
    type: "function",
    name: "stake",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "unstake",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimRewards",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "stakedBalance",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "pendingRewards",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "totalStaked",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "APY",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "Staked",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Unstaked",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RewardsClaimed",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;

// ─── Payment Processor ABI ───────────────────────────────────────────────────
export const PAYMENT_ABI = [
  {
    type: "function",
    name: "payForService",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "serviceId", type: "bytes32" },
      { name: "reference", type: "string" },
    ],
    outputs: [{ name: "txRef", type: "bytes32" }],
  },
  {
    type: "event",
    name: "ServicePaid",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "serviceId", type: "bytes32", indexed: true },
      { name: "reference", type: "string", indexed: false },
    ],
  },
] as const;

// USDC has 6 decimals
export const USDC_DECIMALS = 6;

// Parse USDC amount (human-readable → contract units)
export function parseUSDC(amount: string | number): bigint {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return BigInt(Math.round(num * 10 ** USDC_DECIMALS));
}

// Format USDC amount (contract units → human-readable)
export function formatUSDC(amount: bigint, decimals = 2): string {
  const num = Number(amount) / 10 ** USDC_DECIMALS;
  return num.toFixed(decimals);
}
