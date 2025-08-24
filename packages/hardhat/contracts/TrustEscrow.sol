// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustEscrow
 * @dev A secure escrow contract that allows depositors to fund escrows
 * and arbiters to release or refund funds to beneficiaries or depositors respectively.
 * @author Your Name
 */
contract TrustEscrow is ReentrancyGuard, Pausable, Ownable {
    // Custom errors
    error InvalidAddress();
    error OnlyDepositor();
    error OnlyArbiter();
    error AlreadyFunded();
    error NotFunded();
    error AlreadyReleased();
    error InvalidAmount();
    error OnlyDepositorCanSendETH();

    address public depositor;
    address public beneficiary;
    address public arbiter;
    uint256 public amount;
    bool public isFunded;
    bool public isReleased;
    bool public isRefunded;

    event Deposited(address indexed depositor, uint256 amount);
    event Released(address indexed beneficiary, uint256 amount);
    event Refunded(address indexed depositor, uint256 amount);
    event EscrowCreated(address indexed depositor, address indexed beneficiary, address indexed arbiter);

    modifier onlyDepositor() {
        if (msg.sender != depositor) revert OnlyDepositor();
        _;
    }

    modifier onlyArbiter() {
        if (msg.sender != arbiter) revert OnlyArbiter();
        _;
    }

    modifier notFunded() {
        if (isFunded) revert AlreadyFunded();
        _;
    }

    modifier requireFunded() {
        if (!isFunded) revert NotFunded();
        _;
    }

    modifier notReleased() {
        if (isReleased || isRefunded) revert AlreadyReleased();
        _;
    }

    /**
     * @dev Constructor creates a new escrow
     * @param _depositor The address that will fund the escrow
     * @param _beneficiary The address that will receive funds if released
     * @param _arbiter The address that can release or refund funds
     */
    constructor(address _depositor, address _beneficiary, address _arbiter) payable Ownable(_depositor) {
        if (_depositor == address(0)) revert InvalidAddress();
        if (_beneficiary == address(0)) revert InvalidAddress();
        if (_arbiter == address(0)) revert InvalidAddress();
        if (_beneficiary == _arbiter) revert InvalidAddress();
        if (_depositor == _beneficiary) revert InvalidAddress();
        if (_depositor == _arbiter) revert InvalidAddress();

        depositor = _depositor;
        beneficiary = _beneficiary;
        arbiter = _arbiter;

        emit EscrowCreated(depositor, beneficiary, arbiter);
    }

    /**
     * @dev Depositor funds the escrow
     */
    function deposit() external payable onlyDepositor notFunded whenNotPaused nonReentrant {
        if (msg.value == 0) revert InvalidAmount();

        amount = msg.value;
        isFunded = true;
        emit Deposited(depositor, msg.value);
    }

    /**
     * @dev Arbiter releases funds to beneficiary
     */
    function release() external onlyArbiter requireFunded notReleased whenNotPaused nonReentrant {
        isReleased = true;
        
        (bool success, ) = payable(beneficiary).call{value: amount}("");
        require(success, "Failed to send ETH to beneficiary");
        
        emit Released(beneficiary, amount);
    }

    /**
     * @dev Arbiter refunds funds to depositor
     */
    function refund() external onlyArbiter requireFunded notReleased whenNotPaused nonReentrant {
        isRefunded = true;
        
        (bool success, ) = payable(depositor).call{value: amount}("");
        require(success, "Failed to send ETH to depositor");
        
        emit Refunded(depositor, amount);
    }

    /**
     * @dev Get escrow status
     */
    function getEscrowStatus() external view returns (
        address _depositor,
        address _beneficiary,
        address _arbiter,
        uint256 _amount,
        bool _isFunded,
        bool _isReleased,
        bool _isRefunded
    ) {
        return (depositor, beneficiary, arbiter, amount, isFunded, isReleased, isRefunded);
    }

    /**
     * @dev Emergency pause function (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Emergency unpause function (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal function (only owner, when paused)
     */
    function emergencyWithdraw() external onlyOwner whenPaused {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = payable(owner()).call{value: balance}("");
            require(success, "Failed to withdraw ETH");
        }
    }

    /**
     * @dev Function to receive ETH
     */
    receive() external payable {
        // Only allow deposits from the depositor
        if (msg.sender != depositor) {
            revert OnlyDepositorCanSendETH();
        }
        
        // Handle the deposit
        if (!isFunded) {
            amount = msg.value;
            isFunded = true;
            emit Deposited(depositor, msg.value);
        }
    }

    /**
     * @dev Function to handle failed ETH transfers
     */
    fallback() external payable {
        revert("Function not found");
    }
}
