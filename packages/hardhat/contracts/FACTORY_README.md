# TrustEscrowFactory Contract

The `TrustEscrowFactory.sol` contract is a factory contract that allows users to create multiple TrustEscrow instances in a gas-efficient and organized manner.

## 🏭 **Factory Features**

### **Core Functionality**
- **Create Single Escrow**: Deploy individual escrow contracts
- **Create Multiple Escrows**: Deploy multiple escrows in a single transaction
- **Escrow Management**: Track and query all created escrows
- **User Organization**: Organize escrows by user address
- **Status Filtering**: Filter escrows by their current state

### **Security Features**
- **Pausable**: Emergency pause functionality for security
- **Ownable**: Restricted access to emergency functions
- **Input Validation**: Comprehensive parameter validation
- **Role Separation**: Prevents conflicts between depositor, beneficiary, and arbiter

## 🔧 **Key Functions**

### **Escrow Creation**
#### `createEscrow(address _beneficiary, address _arbiter)`
- Creates a single escrow contract
- Returns the address of the created escrow
- Automatically sets the caller as the depositor

#### `createMultipleEscrows(address[] _beneficiaries, address[] _arbiters)`
- Creates multiple escrows in a single transaction
- Maximum of 10 escrows per transaction
- Gas-efficient for bulk operations

### **Query Functions**
#### `getAllEscrows()`
- Returns array of all created escrow addresses

#### `getUserEscrows(address _user)`
- Returns array of escrows created by a specific user

#### `getEscrowCount()`
- Returns total number of escrows created

#### `getEscrowInfo(address _escrow)`
- Returns detailed information about a specific escrow

#### `isValidEscrow(address _escrow)`
- Checks if an address is a valid escrow created by this factory

#### `getEscrowsByStatus(uint8 _status)`
- Filters escrows by status:
  - `0`: All escrows
  - `1`: Funded escrows
  - `2`: Released escrows
  - `3`: Refunded escrows

### **Factory Management**
#### `getFactoryStats()`
- Returns comprehensive factory statistics:
  - Total escrows created
  - Total funded escrows
  - Total released escrows
  - Total refunded escrows

#### `pause()` / `unpause()`
- Emergency functions for the factory owner
- Pauses all escrow creation when needed

## 📊 **Data Structures**

### **EscrowInfo Struct**
```solidity
struct EscrowInfo {
    address depositor;      // Address that created the escrow
    address beneficiary;    // Address that will receive funds
    address arbiter;        // Address that can release/refund
    uint256 createdAt;      // Timestamp when escrow was created
    bool exists;            // Whether this escrow exists
}
```

## 🚀 **Usage Examples**

### **Deploying the Factory**
```solidity
// Deploy the factory
TrustEscrowFactory factory = new TrustEscrowFactory();
```

### **Creating a Single Escrow**
```solidity
// Create escrow with beneficiary and arbiter
address escrowAddress = factory.createEscrow(beneficiaryAddress, arbiterAddress);

// Get escrow info
EscrowInfo memory info = factory.getEscrowInfo(escrowAddress);
```

### **Creating Multiple Escrows**
```solidity
// Create multiple escrows at once
address[] memory beneficiaries = [ben1, ben2, ben3];
address[] memory arbiters = [arb1, arb2, arb3];
address[] memory escrows = factory.createMultipleEscrows(beneficiaries, arbiters);
```

### **Querying Factory Data**
```solidity
// Get all escrows
address[] memory allEscrows = factory.getAllEscrows();

// Get user's escrows
address[] memory userEscrows = factory.getUserEscrows(userAddress);

// Get factory statistics
(uint256 total, uint256 funded, uint256 released, uint256 refunded) = factory.getFactoryStats();
```

## 🔒 **Security Considerations**

### **Access Control**
- Only factory owner can pause/unpause
- Users can only create escrows for themselves (as depositor)
- No user can be both depositor and beneficiary/arbiter

### **Input Validation**
- Prevents zero address usage
- Prevents duplicate role assignments
- Limits bulk operations to prevent DoS

### **Emergency Controls**
- Factory can be paused in emergencies
- All escrow creation is blocked when paused
- Owner can unpause when safe

## 💰 **Gas Optimization**

### **Efficient Storage**
- Uses arrays for global tracking
- Mappings for user-specific queries
- Structs for organized data storage

### **Bulk Operations**
- Multiple escrow creation in single transaction
- Reduced gas costs for bulk deployments
- Efficient status filtering

## 🧪 **Testing**

### **Run Factory Tests**
```bash
bun run hardhat:test
```

### **Run Factory Demo**
```bash
bun run demo:factory
```

### **Test Coverage**
- Deployment and initialization
- Single and multiple escrow creation
- Query functions and data retrieval
- Pause/unpause functionality
- Factory statistics
- Integration with TrustEscrow contracts

## 📈 **Deployment**

### **Deploy Factory**
```bash
bun run deploy
```

The factory will be deployed after the TrustEscrow contract due to dependencies.

## 🔗 **Integration**

### **Frontend Integration**
- Use factory to create new escrows
- Query user's escrow history
- Display factory statistics
- Filter escrows by status

### **Backend Integration**
- Monitor factory events
- Track escrow creation
- Generate reports and analytics
- Manage factory operations

## 📝 **Events**

### **EscrowCreated**
```solidity
event EscrowCreated(
    address indexed escrowAddress,
    address indexed depositor,
    address indexed beneficiary,
    address arbiter,
    uint256 timestamp
);
```

### **FactoryPaused/FactoryUnpaused**
```solidity
event FactoryPaused(address indexed pauser);
event FactoryUnpaused(address indexed unpauser);
```

## 🎯 **Use Cases**

1. **DApp Integration**: Easy escrow creation for web applications
2. **Bulk Operations**: Create multiple escrows for business needs
3. **User Management**: Track escrows per user
4. **Analytics**: Monitor factory usage and statistics
5. **Emergency Control**: Pause operations when needed

## 📚 **Additional Resources**

- [TrustEscrow Contract](./README.md) - Individual escrow contract
- [Factory Tests](../test/TrustEscrowFactory.test.ts) - Comprehensive test suite
- [Factory Demo](../scripts/trustEscrowFactoryDemo.ts) - Usage examples

---

**License**: MIT License - see LICENSE file for details.
