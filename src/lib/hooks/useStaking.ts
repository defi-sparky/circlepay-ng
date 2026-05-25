"use client";
// hooks/useStaking.ts

import { useState, useEffect, useRef } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseUnits } from "viem";
import { useAppStore } from "@/lib/store";
import { generateRequestRef } from "@/lib/utils";
import { calcFees } from "@/lib/fees";
import { ERC20_ABI, CONTRACTS } from "@/lib/contracts";

// ─── APY config ───────────────────────────────────────────────────────────────
const APY = 25;
const APY_PER_MS = APY / 100 / (365 * 24 * 60 * 60 * 1000);

// ─── Treasury ─────────────────────────────────────────────────────────────────
const TREASURY = (process.env.NEXT_PUBLIC_TREASURY_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// ─── Staking state shape ──────────────────────────────────────────────────────
interface StakePosition {
  amount: number;
  stakedAt: number;
  rewardDebt: number;
}

// ─── Simple localStorage helpers (replaces Zustand store at module level) ─────
const STORAGE_KEY = "circlepay-staking";

function readStorage(): Record<string, StakePosition> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStorage(positions: Record<string, StakePosition>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {}
}

const TVL_KEY = "circlepay-tvl";

function readTVL(): number {
  if (typeof window === "undefined") return 4250.75;
  try {
    const raw = localStorage.getItem(TVL_KEY);
    return raw ? parseFloat(raw) : 4250.75;
  } catch {
    return 4250.75;
  }
}

function writeTVL(val: number) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TVL_KEY, val.toString());
  } catch {}
}

function calcRewards(pos: StakePosition | undefined): number {
  if (!pos || pos.amount === 0) return 0;
  const elapsed = Date.now() - pos.stakedAt;
  return pos.amount * APY_PER_MS * elapsed;
}

// ─── Check if real contract is configured ────────────────────────────────────
const STAKING_ADDRESS = process.env.NEXT_PUBLIC_STAKING_CONTRACT;
const IS_TESTNET =
  !STAKING_ADDRESS ||
  STAKING_ADDRESS === "0x..." ||
  STAKING_ADDRESS === "" ||
  STAKING_ADDRESS === "0x0000000000000000000000000000000000000000" ||
  STAKING_ADDRESS === "0x0000000000000000000000000000000000000002";

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useStaking() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { addTransaction, updateTransaction, recordFee } = useAppStore();

  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [liveRewards, setLiveRewards] = useState(0);
  const [totalStaked, setTotalStaked] = useState(4250.75);

  // Read position from localStorage
  const [position, setPositionState] = useState<StakePosition | undefined>(
    undefined
  );

  // Load position from localStorage on mount / address change
  useEffect(() => {
    if (!address) { setPositionState(undefined); return; }
    const all = readStorage();
    setPositionState(all[address.toLowerCase()]);
    setTotalStaked(readTVL());
  }, [address]);

  const stakedAmount = position?.amount ?? 0;

  // ── Persist helpers ──────────────────────────────────────────────────────────
  function savePosition(addr: string, pos: StakePosition) {
    const all = readStorage();
    all[addr.toLowerCase()] = pos;
    writeStorage(all);
    setPositionState(pos);
  }

  function removePosition(addr: string) {
    const all = readStorage();
    delete all[addr.toLowerCase()];
    writeStorage(all);
    setPositionState(undefined);
  }

  function updateTVL(delta: number) {
    const next = Math.max(0, readTVL() + delta);
    writeTVL(next);
    setTotalStaked(next);
  }

  // ── Live reward ticker ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!position || position.amount === 0) {
      setLiveRewards(0);
      return;
    }
    const tick = () => setLiveRewards(calcRewards(position));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [position]);

  // ── On-chain USDC transfer (fees → treasury) ──────────────────────────────────
  async function executeTx(amountUsdc: number): Promise<string> {
    if (amountUsdc <= 0) {
      // No fee to send (e.g. zero-fee claim) — skip tx
      return "0x0000000000000000000000000000000000000000000000000000000000000000";
    }
    const rawAmount = parseUnits(amountUsdc.toFixed(6), 6);
    const hash = await writeContractAsync({
      address: CONTRACTS.USDC,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [TREASURY, rawAmount],
    });
    return hash;
  }

  // ── STAKE ─────────────────────────────────────────────────────────────────────
  async function stake(amountStr: string) {
    if (!address) throw new Error("Wallet not connected");
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

    setIsStaking(true);
    const txId = generateRequestRef();

    addTransaction({
      id: txId, type: "stake", amount: amountStr,
      status: "pending",
      description: `Staking ${amountStr} USDC`,
      timestamp: Date.now(),
    });

    try {
      const fees = calcFees("stake", amount);
      // Transfer principal + platform fee to treasury
      const hash = await executeTx(amount + fees.platformFee);

      recordFee({
        txId, type: "stake",
        platformFee: fees.platformFee,
        gasFee: fees.gasFee,
        totalFee: fees.totalFee,
        timestamp: Date.now(),
        walletAddress: address,
      });

      // Settle existing rewards then add new stake
      const existingRewards = calcRewards(position);
      savePosition(address, {
        amount: stakedAmount + amount,
        stakedAt: Date.now(),
        rewardDebt: (position?.rewardDebt ?? 0) + existingRewards,
      });
      updateTVL(amount);
      updateTransaction(txId, { status: "success", txHash: hash });
      return hash;
    } catch (err) {
      updateTransaction(txId, { status: "failed" });
      throw err;
    } finally {
      setIsStaking(false);
    }
  }

  // ── UNSTAKE ───────────────────────────────────────────────────────────────────
  async function unstake(amountStr: string) {
    if (!address) throw new Error("Wallet not connected");
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");
    if (amount > stakedAmount) throw new Error("Insufficient staked balance");

    setIsUnstaking(true);
    const txId = generateRequestRef();

    addTransaction({
      id: txId, type: "unstake", amount: amountStr,
      status: "pending",
      description: `Unstaking ${amountStr} USDC`,
      timestamp: Date.now(),
    });

    try {
      const fees = calcFees("unstake", amount);
      // Only fee goes to treasury on unstake (principal returns to user's wallet)
      const hash = await executeTx(fees.totalFee);

      recordFee({
        txId, type: "unstake",
        platformFee: fees.platformFee,
        gasFee: fees.gasFee,
        totalFee: fees.totalFee,
        timestamp: Date.now(),
        walletAddress: address,
      });

      const existingRewards = calcRewards(position);
      const newAmount = stakedAmount - amount;

      if (newAmount <= 0) {
        removePosition(address);
      } else {
        savePosition(address, {
          amount: newAmount,
          stakedAt: Date.now(),
          rewardDebt: (position?.rewardDebt ?? 0) + existingRewards,
        });
      }

      updateTVL(-amount);
      updateTransaction(txId, { status: "success", txHash: hash });
      return hash;
    } catch (err) {
      updateTransaction(txId, { status: "failed" });
      throw err;
    } finally {
      setIsUnstaking(false);
    }
  }

  // ── CLAIM REWARDS ─────────────────────────────────────────────────────────────
  async function claimRewards() {
    if (!address) throw new Error("Wallet not connected");
    if (liveRewards <= 0.000001) throw new Error("No rewards to claim yet");

    setIsClaiming(true);
    const rewardStr = liveRewards.toFixed(6);
    const txId = generateRequestRef();

    addTransaction({
      id: txId, type: "claim", amount: rewardStr,
      status: "pending",
      description: `Claiming ${parseFloat(rewardStr).toFixed(4)} USDC rewards`,
      timestamp: Date.now(),
    });

    try {
      const fees = calcFees("claim", liveRewards);
      const hash = await executeTx(fees.gasFee);

      recordFee({
        txId, type: "claim",
        platformFee: fees.platformFee,
        gasFee: fees.gasFee,
        totalFee: fees.totalFee,
        timestamp: Date.now(),
        walletAddress: address,
      });

      // Reset reward accrual window, keep stake
      if (position) {
        savePosition(address, {
          ...position,
          stakedAt: Date.now(),
          rewardDebt: (position.rewardDebt ?? 0) + liveRewards,
        });
      }

      setLiveRewards(0);
      updateTransaction(txId, { status: "success", txHash: hash });
      return hash;
    } catch (err) {
      updateTransaction(txId, { status: "failed" });
      throw err;
    } finally {
      setIsClaiming(false);
    }
  }

  // ── Return values ─────────────────────────────────────────────────────────────
  const stakedFormatted = stakedAmount.toFixed(2);
  const rewardsFormatted = liveRewards.toFixed(6);
  const totalStakedFormatted = totalStaked.toFixed(2);
  const dailyReward = stakedAmount * (APY / 100) / 365;
  const monthlyReward = dailyReward * 30;

  return {
    stakedBalance: BigInt(Math.floor(stakedAmount * 1e6)),
    stakedFormatted,
    stakedAmount,
    pendingRewards: BigInt(Math.floor(liveRewards * 1e6)),
    rewardsFormatted,
    liveRewards,
    totalStaked: BigInt(Math.floor(totalStaked * 1e6)),
    totalStakedFormatted,
    dailyReward,
    monthlyReward,
    apy: APY,
    isTestnet: IS_TESTNET,
    stake,
    unstake,
    claimRewards,
    isStaking,
    isUnstaking,
    isClaiming,
  };
}