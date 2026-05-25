// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CirclePayStaking
 * @notice Simple USDC staking contract for Arc Testnet
 * @dev Users stake USDC to earn rewards at a fixed APY (25% testnet rate).
 *      The contract owner funds the reward pool. No lock-up period.
 *
 * Deployment: Arc Testnet
 * Gas token: USDC (Arc native)
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract CirclePayStaking {
    // ─── State ───────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    address public owner;

    /// @notice APY in basis points (e.g. 2500 = 25.00%)
    uint256 public apyBps = 2500;

    /// @notice Total USDC currently staked across all users
    uint256 public totalStaked;

    struct StakeInfo {
        uint256 amount;          // USDC staked (6 decimals)
        uint256 rewardDebt;      // Rewards already claimed
        uint256 lastUpdateTime;  // Timestamp of last stake/unstake/claim
    }

    mapping(address => StakeInfo) private _stakes;

    // ─── Events ──────────────────────────────────────────────────────────────

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardPoolFunded(uint256 amount);
    event ApyUpdated(uint256 newApyBps);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "CirclePayStaking: not owner");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    /**
     * @param _usdc Address of the USDC contract on Arc Testnet
     */
    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
        owner = msg.sender;
    }

    // ─── User functions ───────────────────────────────────────────────────────

    /**
     * @notice Stake USDC to earn APY rewards
     * @param amount Amount of USDC to stake (in USDC smallest unit, 6 decimals)
     */
    function stake(uint256 amount) external {
        require(amount > 0, "CirclePayStaking: amount must be > 0");

        StakeInfo storage info = _stakes[msg.sender];

        // Settle any pending rewards before modifying balance
        _settleRewards(msg.sender);

        // Transfer USDC from user to this contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "CirclePayStaking: USDC transfer failed"
        );

        info.amount += amount;
        totalStaked += amount;

        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Unstake USDC (partial or full)
     * @param amount Amount of USDC to unstake
     */
    function unstake(uint256 amount) external {
        StakeInfo storage info = _stakes[msg.sender];
        require(info.amount >= amount, "CirclePayStaking: insufficient staked balance");
        require(amount > 0, "CirclePayStaking: amount must be > 0");

        // Settle pending rewards first
        _settleRewards(msg.sender);

        info.amount -= amount;
        totalStaked -= amount;

        require(
            usdc.transfer(msg.sender, amount),
            "CirclePayStaking: USDC transfer failed"
        );

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Claim all pending rewards without unstaking
     */
    function claimRewards() external {
        _settleRewards(msg.sender);
        // Rewards already transferred in _settleRewards if > 0
    }

    // ─── View functions ───────────────────────────────────────────────────────

    /**
     * @notice Returns the staked USDC balance of a user
     */
    function stakedBalance(address user) external view returns (uint256) {
        return _stakes[user].amount;
    }

    /**
     * @notice Returns the pending (unclaimed) rewards for a user
     */
    function pendingRewards(address user) external view returns (uint256) {
        StakeInfo storage info = _stakes[user];
        if (info.amount == 0 || info.lastUpdateTime == 0) return 0;

        uint256 elapsed = block.timestamp - info.lastUpdateTime;
        // rewards = principal * APY * time / (365 days * 10000)
        uint256 rewards = (info.amount * apyBps * elapsed) / (365 days * 10_000);
        return rewards;
    }

    /**
     * @notice Returns the current APY (in whole percent, e.g. 25 = 25%)
     */
    function APY() external view returns (uint256) {
        return apyBps / 100;
    }

    /**
     * @notice Returns reward pool balance (how much is available to pay out)
     */
    function rewardPoolBalance() external view returns (uint256) {
        uint256 contractBalance = usdc.balanceOf(address(this));
        return contractBalance > totalStaked ? contractBalance - totalStaked : 0;
    }

    // ─── Owner functions ──────────────────────────────────────────────────────

    /**
     * @notice Fund the reward pool with USDC
     * @param amount Amount of USDC to add to reward pool
     */
    function fundRewardPool(uint256 amount) external onlyOwner {
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "CirclePayStaking: funding failed"
        );
        emit RewardPoolFunded(amount);
    }

    /**
     * @notice Update the APY (in basis points, e.g. 2500 = 25%)
     * @param newApyBps New APY in basis points
     */
    function setApy(uint256 newApyBps) external onlyOwner {
        require(newApyBps <= 10_000, "CirclePayStaking: APY cannot exceed 100%");
        apyBps = newApyBps;
        emit ApyUpdated(newApyBps);
    }

    /**
     * @notice Transfer contract ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "CirclePayStaking: invalid address");
        owner = newOwner;
    }

    /**
     * @notice Emergency withdrawal of all USDC (owner only)
     * @dev Use only in emergencies. Emits no event to keep it auditable via tx.
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(usdc.transfer(owner, balance), "CirclePayStaking: transfer failed");
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /**
     * @dev Calculate and pay out pending rewards for a user.
     *      Updates lastUpdateTime. If rewards > 0 and pool has funds, transfers them.
     */
    function _settleRewards(address user) internal {
        StakeInfo storage info = _stakes[user];

        if (info.amount > 0 && info.lastUpdateTime > 0) {
            uint256 elapsed = block.timestamp - info.lastUpdateTime;
            uint256 rewards = (info.amount * apyBps * elapsed) / (365 days * 10_000);

            if (rewards > 0) {
                uint256 available = usdc.balanceOf(address(this)) > totalStaked
                    ? usdc.balanceOf(address(this)) - totalStaked
                    : 0;

                if (available >= rewards) {
                    require(
                        usdc.transfer(user, rewards),
                        "CirclePayStaking: reward transfer failed"
                    );
                    info.rewardDebt += rewards;
                    emit RewardsClaimed(user, rewards);
                }
                // If not enough in pool, rewards accrue silently (no revert)
            }
        }

        info.lastUpdateTime = block.timestamp;
    }
}
