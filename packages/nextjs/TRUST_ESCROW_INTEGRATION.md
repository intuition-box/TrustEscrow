# Trust Escrow Frontend Integration

This document explains how to integrate your HTML frontend with the existing smart contracts and Next.js infrastructure.

## 🏗️ What's Been Created

1. **`TrustEscrowApp.tsx`** - Main React component integrating your frontend with smart contracts
2. **`trust-escrow.css`** - Custom CSS styles matching your HTML design
3. **`/escrow` page** - New route for the Trust Escrow application
4. **`contracts.ts`** - Configuration file for contract addresses and networks
5. **`generate-abis.ts`** - Script to generate proper ABIs from your contracts

## 🚀 Quick Start

### 1. Compile Your Contracts

First, compile your Hardhat contracts to generate the artifacts:

```bash
cd packages/hardhat
npm run compile
# or
bun run compile
```

### 2. Generate ABIs

Run the ABI generation script to create TypeScript ABIs:

```bash
cd packages/nextjs
bun run tsx scripts/generate-abis.ts
```

This will create:
- `types/contracts/TrustEscrow.ts`
- `types/contracts/TrustEscrowFactory.ts`

### 3. Deploy Contracts

Deploy your contracts to get the addresses:

```bash
cd packages/hardhat
npm run deploy
# or
bun run deploy
```

### 4. Update Contract Addresses

Update the contract addresses in `config/contracts.ts`:

```typescript
contracts: {
  TrustEscrowFactory: {
    address: "0x...", // Your deployed factory address
    abi: "TrustEscrowFactory",
  },
  // ...
}
```

### 5. Import Generated ABIs

Update your `TrustEscrowApp.tsx` to use the generated ABIs:

```typescript
// Replace the hardcoded ABIs with:
import { TrustEscrowFactoryABI } from "../types/contracts/TrustEscrowFactory";
import { TrustEscrowABI } from "../types/contracts/TrustEscrow";

// Then use them in your contract interactions:
const { write: createEscrow } = useContractWrite({
  address: FACTORY_ADDRESS as `0x${string}`,
  abi: TrustEscrowFactoryABI,
  functionName: 'createEscrowExternal',
});
```

### 6. Add CSS Import

Import the custom CSS in your main layout or page:

```typescript
// In your layout.tsx or page.tsx
import "../styles/trust-escrow.css";
```

## 🔧 Integration Details

### Smart Contract Integration

Your frontend now integrates with:

- **`TrustEscrowFactory`** - Creates new escrow contracts
- **`TrustEscrow`** - Individual escrow contract instances

### Web3 Integration

The component uses your existing Web3 setup:
- **Wagmi** for contract interactions
- **Viem** for Ethereum utilities
- **RainbowKit** for wallet connection
- **React Hot Toast** for notifications

### Key Features

1. **Create Escrow** - Users can create new escrow contracts
2. **Role Detection** - Automatically detects user's role (depositor/arbiter/beneficiary)
3. **Transaction Management** - View and manage escrow transactions
4. **Real-time Updates** - Transaction status updates
5. **Responsive Design** - Works on all device sizes

## 📱 Usage

### For Users

1. **Connect Wallet** - Use your existing wallet connection
2. **Create Escrow** - Fill out the form with beneficiary and arbiter addresses
3. **Deposit Funds** - Send ETH to the escrow contract
4. **Manage Transactions** - View all your escrow contracts

### For Developers

1. **Customize UI** - Modify the CSS in `trust-escrow.css`
2. **Add Features** - Extend the component with additional functionality
3. **Integrate Events** - Listen to smart contract events for real-time updates
4. **Add Validation** - Implement additional form validation

## 🎨 Customization

### Styling

The component uses a combination of:
- **Tailwind CSS** (your existing setup)
- **Custom CSS** (in `trust-escrow.css`)
- **Responsive design** for mobile and desktop

### Adding New Features

You can easily extend the component:

```typescript
// Add new state
const [newFeature, setNewFeature] = useState(false);

// Add new functions
const handleNewFeature = () => {
  // Your logic here
};

// Add new UI elements
{newFeature && (
  <div className="card">
    <h3>New Feature</h3>
    {/* Your UI here */}
  </div>
)}
```

## 🔍 Troubleshooting

### Common Issues

1. **Contract Not Found**
   - Ensure contracts are compiled and deployed
   - Check contract addresses in `config/contracts.ts`

2. **ABI Errors**
   - Run the ABI generation script
   - Check that contract artifacts exist

3. **Wallet Connection Issues**
   - Verify your Web3 setup is working
   - Check network configuration

4. **Styling Issues**
   - Ensure `trust-escrow.css` is imported
   - Check for CSS conflicts with existing styles

### Debug Mode

Enable debug logging:

```typescript
// Add to your component
const DEBUG = true;

if (DEBUG) {
  console.log('Contract interaction:', { address, functionName, args });
}
```

## 📚 Next Steps

1. **Test the Integration** - Create test escrows on localhost
2. **Add Event Listeners** - Listen to contract events for real-time updates
3. **Implement Caching** - Cache contract data for better performance
4. **Add Analytics** - Track user interactions and contract usage
5. **Security Review** - Audit the integration for security best practices

## 🤝 Contributing

To contribute to this integration:

1. Test the functionality thoroughly
2. Follow the existing code style
3. Add proper TypeScript types
4. Update documentation as needed
5. Test on multiple networks and devices

## 📄 License

This integration follows the same license as your main project.

---

**Need Help?** Check the existing documentation or create an issue in your repository.

