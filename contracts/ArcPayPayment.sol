// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CirclePayPayment
 * @notice Payment processor contract for CirclePay NG utility payments
 * @dev Users call payForService() with USDC. The contract forwards funds to
 *      the treasury wallet. The backend listens for ServicePaid events and
 *      then calls the VTpass API to deliver the purchased service.
 *
 * Flow:
 *   1. User approves this contract to spend USDC
 *   2. User calls payForService(amount, serviceId, txReference)
 *   3. Contract emits ServicePaid event with all details
 *   4. CirclePay backend picks up event → calls VTpass API → delivers service
 *   5. If delivery fails, admin can issue refund via refundPayment()
 */

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ArcPayPayment {
    // ─── State ───────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    address public owner;
    address public treasury;

    /// @notice Fee in basis points taken on each payment (e.g. 50 = 0.5%)
    uint256 public feeBps = 50;

    /// @notice Minimum payment amount (0.50 USDC in 6-decimal units)
    uint256 public minPayment = 500_000;

    /// @notice Track payment status to prevent double-processing
    mapping(bytes32 => PaymentStatus) public payments;

    enum PaymentStatus { None, Pending, Completed, Refunded }

    struct Payment {
        address payer;
        uint256 amount;
        uint256 fee;
        bytes32 serviceId;
        string  txReference;
        uint256 timestamp;
        PaymentStatus status;
    }

    mapping(bytes32 => Payment) public paymentDetails;

    // ─── Events ──────────────────────────────────────────────────────────────

    event ServicePaid(
        address indexed payer,
        uint256 amount,
        uint256 fee,
        bytes32 indexed serviceId,
        string txReference,
        bytes32 paymentId
    );

    event PaymentCompleted(bytes32 indexed paymentId);
    event PaymentRefunded(bytes32 indexed paymentId, address indexed payer, uint256 amount);
    event TreasuryUpdated(address newTreasury);
    event FeeUpdated(uint256 newFeeBps);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "CirclePayPayment: not owner");
        _;
    }

    modifier onlyOwnerOrTreasury() {
        require(
            msg.sender == owner || msg.sender == treasury,
            "CirclePayPayment: unauthorized"
        );
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _usdc, address _treasury) {
        require(_usdc != address(0), "Invalid USDC");
        require(_treasury != address(0), "Invalid treasury");
        usdc = IERC20(_usdc);
        treasury = _treasury;
        owner = msg.sender;
    }

    // ─── User functions ───────────────────────────────────────────────────────

    /**
     * @notice Pay for a utility service with USDC
     * @param amount       USDC amount (6 decimals, e.g. 1_000_000 = 1 USDC)
     * @param serviceId    Bytes32 identifier for the service type (e.g. keccak("airtime-mtn"))
     * @param txReference    Unique human-readable txReference from the app (e.g. "ARC1234ABCD")
     * @return paymentId   Unique on-chain payment ID
     */
    function payForService(
        uint256 amount,
        bytes32 serviceId,
        string calldata txReference
    ) external returns (bytes32 paymentId) {
        require(amount >= minPayment, "CirclePayPayment: below minimum payment");
        require(bytes(txReference).length > 0, "CirclePayPayment: empty txReference");

        // Compute deterministic payment ID
        paymentId = keccak256(
            abi.encodePacked(msg.sender, txReference, block.timestamp, amount)
        );

        // Prevent duplicate txReferences
        require(
            payments[paymentId] == PaymentStatus.None,
            "CirclePayPayment: duplicate payment"
        );

        // Calculate fee
        uint256 fee = (amount * feeBps) / 10_000;
        uint256 netAmount = amount - fee;

        // Transfer full amount from user to this contract
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "CirclePayPayment: USDC transfer failed"
        );

        // Forward net amount to treasury (minus fee which stays in contract)
        require(
            usdc.transfer(treasury, netAmount),
            "CirclePayPayment: treasury transfer failed"
        );

        // Record payment
        payments[paymentId] = PaymentStatus.Pending;
        paymentDetails[paymentId] = Payment({
            payer:     msg.sender,
            amount:    amount,
            fee:       fee,
            serviceId: serviceId,
            txReference: txReference,
            timestamp: block.timestamp,
            status:    PaymentStatus.Pending
        });

        emit ServicePaid(msg.sender, amount, fee, serviceId, txReference, paymentId);
        return paymentId;
    }

    // ─── Admin functions ──────────────────────────────────────────────────────

    /**
     * @notice Mark a payment as completed after VTpass delivery
     * @param paymentId The on-chain payment ID
     */
    function markCompleted(bytes32 paymentId) external onlyOwnerOrTreasury {
        require(
            payments[paymentId] == PaymentStatus.Pending,
            "CirclePayPayment: not pending"
        );
        payments[paymentId] = PaymentStatus.Completed;
        paymentDetails[paymentId].status = PaymentStatus.Completed;
        emit PaymentCompleted(paymentId);
    }

    /**
     * @notice Refund a failed payment. Treasury must re-fund the contract first.
     * @param paymentId The payment to refund
     */
    function refundPayment(bytes32 paymentId) external onlyOwnerOrTreasury {
        Payment storage p = paymentDetails[paymentId];
        require(
            payments[paymentId] == PaymentStatus.Pending,
            "CirclePayPayment: not refundable"
        );

        payments[paymentId] = PaymentStatus.Refunded;
        p.status = PaymentStatus.Refunded;

        // Refund full amount to payer (net + fee returned as goodwill)
        require(
            usdc.transfer(p.payer, p.amount - p.fee),
            "CirclePayPayment: refund transfer failed"
        );

        emit PaymentRefunded(paymentId, p.payer, p.amount - p.fee);
    }

    /**
     * @notice Update treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    /**
     * @notice Update fee in basis points (max 5% = 500 bps)
     */
    function setFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 500, "CirclePayPayment: fee too high");
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeBps);
    }

    /**
     * @notice Withdraw accumulated fees (stays in contract, not forwarded)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "CirclePayPayment: no fees to withdraw");
        require(usdc.transfer(owner, balance), "CirclePayPayment: withdrawal failed");
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
}
