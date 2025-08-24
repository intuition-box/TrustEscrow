# TrustEscrow - Secure Decentralized Escrow Platform

A secure, decentralized escrow platform built on Ethereum with smart contract protection. This platform allows three parties (Depositor, Arbiter, and Beneficiary) to create and manage escrow agreements with trustless smart contract execution.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Bun package manager
- MetaMask or compatible Web3 wallet
- Local Hardhat network running

### 1. Start the Development Environment

Open **3 terminal windows** and run these commands:

**Terminal 1 - Start Hardhat Node:**
```bash
cd packages/hardhat
bun run chain
```

**Terminal 2 - Deploy Contracts:**
```bash
cd packages/hardhat
bun run deploy
```

**Terminal 3 - Start Frontend:**
```bash
cd packages/nextjs
bun run dev
```

### 2. Access the Application
- Open your browser and go to `http://localhost:3000`
- Click "Launch Escrow App" to go to `/escrow`
- Connect your MetaMask wallet to the Hardhat network (Chain ID: 31337)

## 🏗️ How It Works

### Three-Party Escrow System

1. **Depositor** - Creates the escrow contract and deposits funds
2. **Arbiter** - Reviews work completion and decides to release or refund funds
3. **Beneficiary** - Completes the work and receives payment when released

### Smart Contract Flow

1. **Creation**: Depositor creates escrow with beneficiary and arbiter addresses
2. **Funding**: Depositor sends ETH to the escrow contract
3. **Work Completion**: Beneficiary completes the agreed work
4. **Arbitration**: Arbiter reviews and decides on fund release
5. **Resolution**: Funds are either released to beneficiary or refunded to depositor

## 💻 Usage Guide

### Creating an Escrow

1. **Connect Wallet**: Use the "Connect Wallet" button in the header
2. **Fill Form**: 
   - Escrow Title: Describe the project
   - Description: Detailed work description
   - Amount: ETH amount to escrow
   - Arbiter Address: Trusted third-party address
   - Beneficiary Address: Worker/service provider address
   - Terms: Conditions for fund release
3. **Submit**: Click "Create Escrow Contract"

### Managing Transactions

- **My Transactions Tab**: View all escrows where you're involved
- **Role-Based Actions**:
  - **Depositor**: Can deposit funds if not funded
  - **Arbiter**: Can release or refund funds
  - **Beneficiary**: Can track transaction status

### Quick Test Addresses

Use these addresses for testing:

- **Beneficiary**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Arbiter**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

## 🔧 Technical Details

### Smart Contracts

- **TrustEscrow.sol**: Individual escrow contract with pause/emergency functions
- **TrustEscrowFactory.sol**: Factory contract for creating escrow instances

### Frontend

- **Next.js 14**: React framework with App Router
- **Wagmi**: React hooks for Ethereum interaction
- **RainbowKit**: Wallet connection UI
- **Tailwind CSS**: Utility-first CSS framework

### Network Configuration

- **Hardhat Network**: Local development (Chain ID: 31337)
- **RPC URL**: `http://127.0.0.1:8545`
- **Gas Limit**: Auto-calculated

## 🧪 Testing

### Running Tests
```bash
cd packages/hardhat
bun run test
```

### Test Coverage
```bash
cd packages/hardhat
bun run coverage
```

## 🚨 Troubleshooting

### Common Issues

1. **"Nonce too high"**: Reset MetaMask account or wait for transaction confirmation
2. **"User rejected request"**: Transaction was cancelled in wallet
3. **"Insufficient funds"**: Check wallet balance and gas fees
4. **Hydration errors**: Refresh page and ensure consistent rendering

### Reset MetaMask Account
1. Open MetaMask
2. Go to Settings → Advanced
3. Click "Reset Account" (this clears transaction history)

### Restart Services
If issues persist:
1. Stop all terminals (Ctrl+C)
2. Restart Hardhat node: `bun run chain`
3. Redeploy contracts: `bun run deploy`
4. Restart frontend: `bun run dev`

## 📁 Project Structure

```
escrow/
├── packages/
│   ├── hardhat/          # Smart contracts & deployment
│   │   ├── contracts/    # Solidity contracts
│   │   ├── scripts/      # Deployment scripts
│   │   └── test/         # Contract tests
│   └── nextjs/           # Frontend application
│       ├── app/          # Next.js app router
│       ├── components/   # React components
│       └── styles/       # CSS styles
└── README.md
```

## 🔒 Security Features

- **Reentrancy Protection**: Prevents reentrancy attacks
- **Pausable**: Emergency pause functionality
- **Ownable**: Access control for admin functions
- **Custom Errors**: Gas-efficient error handling
- **Event Emission**: Transparent transaction tracking

## 🌟 Features

- **Wallet Integration**: MetaMask and other Web3 wallets
- **Real-time Updates**: Live transaction status
- **Role-Based Access**: Automatic permission management
- **Responsive Design**: Mobile and desktop optimized
- **Dark Theme**: Modern, professional UI
- **Transaction History**: Complete audit trail

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the smart contract code
3. Check browser console for errors
4. Ensure all services are running

---

**Happy Escrowing! 🚀**