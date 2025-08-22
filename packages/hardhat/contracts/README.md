# Smart Contracts

This directory contains the smart contracts for the Scaffold-ETH 2 project.

## TrustEscrow Contract

The `TrustEscrow.sol` contract is a secure, feature-rich escrow contract that allows depositors to fund escrows and arbiters to release or refund funds.

### Features

- **Secure Escrow**: Funds are held securely until released or refunded
- **Role-based Access Control**: Only authorized parties can perform specific actions
- **Pausable**: Emergency pause functionality for security
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Comprehensive Events**: Full event logging for transparency
- **Emergency Functions**: Owner can pause and withdraw funds in emergencies

### Contract Roles

1. **Depositor**: The party who funds the escrow
2. **Beneficiary**: The party who receives funds if released
3. **Arbiter**: The trusted party who can release or refund funds
4. **Owner**: The contract deployer with emergency controls

### Key Functions

#### `deposit()`
- Allows the depositor to fund the escrow
- Can only be called once per escrow
- Requires a non-zero ETH amount

#### `release()`
- Allows the arbiter to release funds to the beneficiary
- Can only be called when escrow is funded and not yet resolved
- Transfers the full escrow amount to the beneficiary

#### `refund()`
- Allows the arbiter to refund funds to the depositor
- Can only be called when escrow is funded and not yet resolved
- Transfers the full escrow amount back to the depositor

#### `getEscrowStatus()`
- Returns the complete state of the escrow
- Useful for frontend integration and monitoring

#### `pause()` / `unpause()`
- Emergency functions for the owner
- Pauses all escrow operations when needed

#### `emergencyWithdraw()`
- Allows owner to withdraw funds when contract is paused
- Safety mechanism for emergency situations

### Security Features

- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Can pause operations in emergencies
- **Ownable**: Restricted access to emergency functions
- **Custom Errors**: Gas-efficient error handling
- **Input Validation**: Comprehensive parameter validation

### Usage Examples

#### Deploying the Contract
```solidity
// Deploy with beneficiary and arbiter addresses
TrustEscrow escrow = new TrustEscrow(beneficiaryAddress, arbiterAddress);
```

#### Funding the Escrow
```solidity
// Depositor funds the escrow
escrow.deposit{value: 1 ether}();
```

#### Releasing Funds
```solidity
// Arbiter releases funds to beneficiary
escrow.release();
```

#### Refunding Funds
```solidity
// Arbiter refunds funds to depositor
escrow.refund();
```

### Testing

Run the comprehensive test suite:
```bash
bun run hardhat:test
```

Run the demo script:
```bash
bun run demo:escrow
```

### Deployment

Deploy the contract using the provided deployment script:
```bash
bun run deploy
```

### Gas Optimization

The contract is optimized for gas efficiency:
- Uses custom errors instead of require statements with strings
- Minimal storage operations
- Efficient event emission
- Optimized function modifiers

### Audit Considerations

This contract has been designed with security best practices:
- OpenZeppelin contracts for battle-tested implementations
- Comprehensive access controls
- Emergency pause functionality
- Reentrancy protection
- Input validation and sanitization

### License

MIT License - see LICENSE file for details.
