// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TrustEscrow.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TrustEscrowFactory
 * @dev Factory contract for creating TrustEscrow instances
 * @author Your Name
 */
contract TrustEscrowFactory is Ownable, Pausable {
    // Custom errors
    error InvalidAddress();
    error ArraysLengthMismatch();
    error EmptyArrays();
    error TooManyEscrows();
    error EscrowDoesNotExist();
    error FactoryIsPaused();

    // Array to store all created escrow addresses
    address[] public escrows;
    
    // Mapping from user address to their created escrows
    mapping(address => address[]) public userEscrows;
    
    // Mapping from escrow address to escrow info
    mapping(address => EscrowInfo) public escrowInfo;
    
    // Events
    event EscrowCreated(
        address indexed escrowAddress,
        address indexed depositor,
        address indexed beneficiary,
        address arbiter,
        uint256 timestamp
    );
    
    event FactoryPaused(address indexed pauser);
    event FactoryUnpaused(address indexed unpauser);
    
    // Struct to store escrow information
    struct EscrowInfo {
        address depositor;
        address beneficiary;
        address arbiter;
        uint256 createdAt;
        bool exists;
    }
    
    // Modifiers
    // Note: whenNotPaused is inherited from Pausable contract
    
    /**
     * @dev Constructor sets the factory owner
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new escrow contract
     * @param _beneficiary The address that will receive funds if released
     * @param _arbiter The address that can release or refund funds
     * @return escrowAddress The address of the newly created escrow
     */
    function createEscrow(
        address _beneficiary,
        address _arbiter
    ) internal returns (address escrowAddress) {
        if (_beneficiary == address(0)) revert InvalidAddress();
        if (_arbiter == address(0)) revert InvalidAddress();
        if (_beneficiary == _arbiter) revert InvalidAddress();
        if (_beneficiary == msg.sender) revert InvalidAddress();
        if (_arbiter == msg.sender) revert InvalidAddress();
        
        // Create new escrow contract
        TrustEscrow escrow = new TrustEscrow(msg.sender, _beneficiary, _arbiter);
        escrowAddress = address(escrow);
        
        // Store escrow information
        escrowInfo[escrowAddress] = EscrowInfo({
            depositor: msg.sender,
            beneficiary: _beneficiary,
            arbiter: _arbiter,
            createdAt: block.timestamp,
            exists: true
        });
        
        // Add to global escrows array
        escrows.push(escrowAddress);
        
        // Add to user's escrows array
        userEscrows[msg.sender].push(escrowAddress);
        
        // Emit event
        emit EscrowCreated(
            escrowAddress,
            msg.sender,
            _beneficiary,
            _arbiter,
            block.timestamp
        );
    }

    /**
     * @dev Create a new escrow contract (external function)
     * @param _beneficiary The address that will receive funds if released
     * @param _arbiter The address that can release or refund funds
     * @return escrowAddress The address of the newly created escrow
     */
    function createEscrowExternal(
        address _beneficiary,
        address _arbiter
    ) external whenNotPaused returns (address escrowAddress) {
        return createEscrow(_beneficiary, _arbiter);
    }
    
    /**
     * @dev Create multiple escrows in a single transaction
     * @param _beneficiaries Array of beneficiary addresses
     * @param _arbiters Array of arbiter addresses
     * @return escrowAddresses Array of created escrow addresses
     */
    function createMultipleEscrows(
        address[] calldata _beneficiaries,
        address[] calldata _arbiters
    ) external whenNotPaused returns (address[] memory escrowAddresses) {
        if (_beneficiaries.length != _arbiters.length) revert ArraysLengthMismatch();
        if (_beneficiaries.length == 0) revert EmptyArrays();
        if (_beneficiaries.length > 10) revert TooManyEscrows();
        
        escrowAddresses = new address[](_beneficiaries.length);
        
        for (uint256 i = 0; i < _beneficiaries.length; i++) {
            escrowAddresses[i] = createEscrow(_beneficiaries[i], _arbiters[i]);
        }
    }
    
    /**
     * @dev Get all escrows created by a specific user
     * @param _user The user address
     * @return Array of escrow addresses
     */
    function getUserEscrows(address _user) external view returns (address[] memory) {
        return userEscrows[_user];
    }
    
    /**
     * @dev Get all escrows in the factory
     * @return Array of all escrow addresses
     */
    function getAllEscrows() external view returns (address[] memory) {
        return escrows;
    }
    
    /**
     * @dev Get total number of escrows created
     * @return Total count of escrows
     */
    function getEscrowCount() external view returns (uint256) {
        return escrows.length;
    }
    
    /**
     * @dev Get escrow information by address
     * @param _escrow The escrow contract address
     * @return EscrowInfo struct containing escrow details
     */
    function getEscrowInfo(address _escrow) external view returns (EscrowInfo memory) {
        if (!escrowInfo[_escrow].exists) revert EscrowDoesNotExist();
        return escrowInfo[_escrow];
    }
    
    /**
     * @dev Check if an address is a valid escrow created by this factory
     * @param _escrow The escrow contract address
     * @return True if valid escrow, false otherwise
     */
    function isValidEscrow(address _escrow) external view returns (bool) {
        return escrowInfo[_escrow].exists;
    }
    
    /**
     * @dev Get escrows by status (funded, released, refunded)
     * @param _status The status to filter by (0: all, 1: funded, 2: released, 3: refunded)
     * @return Array of escrow addresses matching the status
     */
    function getEscrowsByStatus(uint8 _status) external view returns (address[] memory) {
        address[] memory filteredEscrows = new address[](escrows.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < escrows.length; i++) {
            address escrowAddr = escrows[i];
            TrustEscrow escrow = TrustEscrow(payable(escrowAddr));
            
            bool include = false;
            if (_status == 0) {
                include = true; // All escrows
            } else if (_status == 1) {
                include = escrow.isFunded();
            } else if (_status == 2) {
                include = escrow.isReleased();
            } else if (_status == 3) {
                include = escrow.isRefunded();
            }
            
            if (include) {
                filteredEscrows[count] = escrowAddr;
                count++;
            }
        }
        
        // Resize array to actual count
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = filteredEscrows[i];
        }
        
        return result;
    }
    
    /**
     * @dev Emergency pause function (only owner)
     */
    function pause() external onlyOwner {
        _pause();
        emit FactoryPaused(msg.sender);
    }
    
    /**
     * @dev Emergency unpause function (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
        emit FactoryUnpaused(msg.sender);
    }
    
    /**
     * @dev Get factory statistics
     * @return totalEscrows Total number of escrows created
     * @return totalFunded Number of funded escrows
     * @return totalReleased Number of released escrows
     * @return totalRefunded Number of refunded escrows
     */
    function getFactoryStats() external view returns (
        uint256 totalEscrows,
        uint256 totalFunded,
        uint256 totalReleased,
        uint256 totalRefunded
    ) {
        totalEscrows = escrows.length;
        
        for (uint256 i = 0; i < escrows.length; i++) {
            TrustEscrow escrow = TrustEscrow(payable(escrows[i]));
            
            if (escrow.isFunded()) {
                totalFunded++;
            }
            if (escrow.isReleased()) {
                totalReleased++;
            }
            if (escrow.isRefunded()) {
                totalRefunded++;
            }
        }
    }
}
