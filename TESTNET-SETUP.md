# Testnet Setup Guide - Wrapped ACG (wACG)

## Overview
This guide provides step-by-step instructions for setting up and testing the Wrapped ACG contract on BSC testnet.

## Prerequisites

### Required Software
- Node.js 16+
- npm or yarn
- MetaMask or similar wallet
- Git

### Required Accounts
- BSC testnet wallet with tBNB for gas fees
- BSCScan API key for contract verification

## Setup Instructions

### 1. Environment Setup

```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Environment Configuration

Edit the `.env` file with testnet configuration:

```bash
# Testnet Deployment Configuration
PRIVATE_KEY=your_testnet_deployment_wallet_private_key

# Testnet addresses (can use Hardhat test accounts)
CUSTODIAN_ADDRESS=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
OWNER_ADDRESS=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

# BSCScan API Key
BSCSCAN_API_KEY=your_bscscan_api_key

# Optional: Gas reporting
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

### 3. Get Testnet BNB

You'll need testnet BNB for deployment and testing:

1. **BSC Testnet Faucet**: https://testnet.binance.org/faucet-smart
2. **Alternative Faucet**: https://faucet.quicknode.com/binance-smart-chain

## Testnet Configuration

### Conservative Test Parameters
```javascript
const testnetConfig = {
  custodian: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  owner: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  maxWrapAmount: ethers.parseUnits("10000", 8),    // 10,000 ACG
  maxUnwrapAmount: ethers.parseUnits("10000", 8),  // 10,000 ACG
  minAmount: ethers.parseUnits("0.00000001", 8),   // 0.00000001 ACG
  dailyWrapLimit: ethers.parseUnits("100000", 8),  // 100,000 ACG
  dailyUnwrapLimit: ethers.parseUnits("100000", 8) // 100,000 ACG
};
```

### Why Conservative Limits?
- **Safety**: Prevents large-scale testing issues
- **Cost**: Reduces gas costs during testing
- **Control**: Easier to manage and monitor
- **Learning**: Allows gradual testing approach

## Deployment Steps

### Step 1: Compile Contracts
```bash
# Compile all contracts
npm run compile

# Verify compilation
ls artifacts/contracts/
```

### Step 2: Run Local Tests
```bash
# Run all tests
npm test

# Run with gas reporting
npm run test:gas

# Run coverage
npm run test:coverage
```

### Step 3: Deploy to Testnet
```bash
# Deploy to BSC testnet
npm run deploy:testnet
```

### Step 4: Verify Contract
```bash
# Verify on BSCScan testnet
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Testing Procedures

### 1. Basic Function Testing
```javascript
// Test wrap function
await wacg.wrap(userAddress, amount, acgTxHash);

// Test unwrap function
await wacg.unwrap(userAddress, amount, acgAddress);

// Test admin functions
await wacg.pause();
await wacg.unpause();
```

### 2. Integration Testing
```javascript
// Test with frontend
// Test with backend watchers
// Test event monitoring
// Test error handling
```

### 3. Load Testing
```javascript
// Test multiple concurrent transactions
// Test daily limits
// Test rate limiting
// Test gas optimization
```

## Testnet URLs and Resources

### Network Information
- **Network Name**: BSC Testnet
- **Chain ID**: 97
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545/
- **Explorer**: https://testnet.bscscan.com/

### Faucets
- **BSC Testnet Faucet**: https://testnet.binance.org/faucet-smart
- **QuickNode Faucet**: https://faucet.quicknode.com/binance-smart-chain

### Test Tokens
- **tBNB**: Available from faucets
- **Test ACG**: Use mock transactions for testing

## Testing Checklist

### ✅ Pre-Deployment
- [ ] Environment configured
- [ ] Dependencies installed
- [ ] Local tests passing
- [ ] Testnet BNB available
- [ ] Private keys secured

### ✅ Deployment
- [ ] Contract compiled successfully
- [ ] Deployment transaction confirmed
- [ ] Contract verified on BSCScan
- [ ] Constructor parameters correct
- [ ] Initial state verified

### ✅ Function Testing
- [ ] Wrap function working
- [ ] Unwrap function working
- [ ] Admin functions working
- [ ] Emergency functions working
- [ ] Events emitting correctly

### ✅ Integration Testing
- [ ] Frontend integration
- [ ] Backend watchers
- [ ] Event monitoring
- [ ] Error handling
- [ ] Gas optimization

### ✅ Security Testing
- [ ] Access control verified
- [ ] Input validation tested
- [ ] Rate limiting working
- [ ] Emergency procedures tested
- [ ] Pause functionality working

## Common Testnet Issues

### Insufficient tBNB
```bash
# Get testnet BNB from faucet
# Visit: https://testnet.binance.org/faucet-smart
```

### Network Issues
```bash
# Check RPC connectivity
curl -X POST https://data-seed-prebsc-1-s1.binance.org:8545/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Contract Verification Issues
```bash
# Ensure constructor arguments match
# Check compiler version
# Verify optimization settings
```

## Monitoring and Debugging

### Contract Monitoring
```javascript
// Monitor contract events
wacg.on('ACGWrapped', (to, amount, acgTxHash, requestId) => {
  console.log('Wrap event:', { to, amount: amount.toString(), acgTxHash, requestId });
});

wacg.on('ACGUnwrapped', (from, amount, acgAddress, requestId) => {
  console.log('Unwrap event:', { from, amount: amount.toString(), acgAddress, requestId });
});
```

### Transaction Monitoring
```javascript
// Monitor transaction status
const tx = await wacg.wrap(userAddress, amount, acgTxHash);
const receipt = await tx.wait();
console.log('Transaction confirmed:', receipt.transactionHash);
```

### Error Handling
```javascript
try {
  await wacg.wrap(userAddress, amount, acgTxHash);
} catch (error) {
  console.error('Wrap failed:', error.message);
  // Handle specific error types
  if (error.message.includes('DailyLimitExceeded')) {
    console.log('Daily limit exceeded');
  }
}
```

## Test Data

### Sample Test Values
```javascript
const testData = {
  userAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  amount: ethers.parseUnits("100", 8), // 100 ACG
  acgTxHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  acgAddress: "AWEwieKZdYWDuBBDYwjN5qNnbjJH95rbw7"
};
```

### Test Scenarios
1. **Normal Operation**: Wrap and unwrap tokens
2. **Limit Testing**: Test daily and transaction limits
3. **Error Handling**: Test invalid inputs
4. **Admin Functions**: Test pause/unpause
5. **Emergency Functions**: Test emergency mint
6. **Edge Cases**: Test minimum/maximum amounts

## Next Steps After Testing

### 1. Analysis
- Review all test results
- Identify any issues
- Document findings
- Plan fixes if needed

### 2. Optimization
- Optimize gas usage
- Improve error handling
- Enhance monitoring
- Update documentation

### 3. Preparation for Mainnet
- Finalize parameters
- Set up multi-sig wallets
- Prepare deployment script
- Plan audit timeline

## Support

### Resources
- **BSC Testnet Docs**: https://docs.binance.org/smart-chain/developer/rpc.html
- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin Docs**: https://docs.openzeppelin.com/

### Contact
- **Technical Support**: support@aurumcryptogold.com
- **Security Issues**: security@aurumcryptogold.com

---

**Last Updated**: December 2024
**Version**: 1.0.0 