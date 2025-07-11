# Deployment Guide - Wrapped ACG (wACG)

## Overview
This guide provides step-by-step instructions for deploying the Wrapped ACG (wACG) smart contract to Binance Smart Chain (BSC) mainnet.

## Prerequisites

### Required Software
- Node.js 16+ 
- npm or yarn
- Git
- MetaMask or similar wallet

### Required Accounts
- BSC mainnet wallet with BNB for gas fees
- BSCScan API key for contract verification
- Multi-sig wallet for owner (recommended)
- Multi-sig wallet for custodian (recommended)

### Required Information
- Custodian address (multi-sig wallet)
- Owner address (multi-sig wallet)
- BSCScan API key
- Private key for deployment wallet

## Setup Instructions

### 1. Environment Setup

```bash
# Clone the repository
git clone https://github.com/aurumcryptogold/wrapped-acg-contracts.git
cd wrapped-acg-contracts

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Environment Configuration

Edit the `.env` file with your configuration:

```bash
# Deployment Configuration
PRIVATE_KEY=your_deployment_wallet_private_key
CUSTODIAN_ADDRESS=your_custodian_multi_sig_address
OWNER_ADDRESS=your_owner_multi_sig_address

# BSCScan API Key (for contract verification)
BSCSCAN_API_KEY=your_bscscan_api_key

# Optional: Gas reporting
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

### 3. Multi-Sig Wallet Setup

**IMPORTANT**: Use multi-sig wallets for both owner and custodian addresses.

#### Recommended Multi-Sig Setup:
- **Owner**: 3-of-5 multi-sig (3 signatures required out of 5 signers)
- **Custodian**: 2-of-3 multi-sig (2 signatures required out of 3 signers)

#### Multi-Sig Providers:
- **Gnosis Safe**: https://safe.gnosis.io/
- **MultiSigWallet**: https://github.com/ConsenSys/MultiSigWallet
- **Argent**: https://www.argent.xyz/

## Pre-Deployment Checklist

### ✅ Security Checklist
- [ ] Multi-sig wallets created and tested
- [ ] Private keys secured and backed up
- [ ] Environment variables configured
- [ ] Network connectivity verified
- [ ] Gas fees calculated and available

### ✅ Testing Checklist
- [ ] All tests passing locally
- [ ] Testnet deployment successful
- [ ] All functions tested on testnet
- [ ] Gas optimization verified
- [ ] Contract size within limits

### ✅ Configuration Checklist
- [ ] Constructor parameters finalized
- [ ] Limits configured appropriately
- [ ] Custodian address verified
- [ ] Owner address verified
- [ ] Deployment wallet funded

## Deployment Parameters

### Recommended Initial Values
```javascript
const config = {
  custodian: "0x...", // Multi-sig wallet address
  owner: "0x...",     // Multi-sig wallet address
  maxWrapAmount: ethers.parseUnits("1000000", 8),    // 1,000,000 ACG
  maxUnwrapAmount: ethers.parseUnits("1000000", 8),  // 1,000,000 ACG
  minAmount: ethers.parseUnits("0.00000001", 8),     // 0.00000001 ACG
  dailyWrapLimit: ethers.parseUnits("10000000", 8),  // 10,000,000 ACG
  dailyUnwrapLimit: ethers.parseUnits("10000000", 8) // 10,000,000 ACG
};
```

### Parameter Considerations
- **Max Wrap/Unwrap Amount**: Set based on expected usage patterns
- **Min Amount**: Set to prevent dust attacks
- **Daily Limits**: Set to prevent abuse while allowing normal usage
- **Custodian**: Must be a secure multi-sig wallet
- **Owner**: Must be a secure multi-sig wallet

## Deployment Steps

### Step 1: Compile Contracts
```bash
# Compile all contracts
npm run compile

# Verify compilation success
ls artifacts/contracts/
```

### Step 2: Run Tests
```bash
# Run all tests
npm test

# Run with gas reporting
npm run test:gas

# Run coverage
npm run test:coverage
```

### Step 3: Deploy to Mainnet
```bash
# Deploy to BSC mainnet
npm run deploy:mainnet
```

### Step 4: Verify Deployment
```bash
# Check deployment status
npx hardhat verify --network bsc <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### Step 5: Test Functions
```bash
# Test all functions on mainnet
npx hardhat console --network bsc
```

## Post-Deployment Steps

### 1. Contract Verification
1. Go to [BSCScan](https://bscscan.com/)
2. Search for your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Enter constructor arguments
6. Verify contract

### 2. Initial Testing
```javascript
// Test wrap function
await wacg.wrap(userAddress, amount, acgTxHash);

// Test unwrap function
await wacg.unwrap(userAddress, amount, acgAddress);

// Test admin functions
await wacg.pause();
await wacg.unpause();
```

### 3. Configuration Updates
Update your frontend and backend configurations:

```javascript
// Frontend Configuration
const config = {
  contractAddress: "0x...", // Deployed contract address
  networkId: 56,            // BSC mainnet
  rpcUrl: "https://bsc-dataseed.binance.org/"
};

// Backend Configuration
const config = {
  contractAddress: "0x...", // Deployed contract address
  bscRpcUrl: "https://bsc-dataseed.binance.org/",
  custodianAddress: "0x..." // Custodian address
};
```

### 4. Monitoring Setup
- Set up BSCScan monitoring
- Configure event monitoring
- Set up alerting systems
- Monitor gas usage

## Security Considerations

### Multi-Sig Wallet Management
- **Owner Multi-Sig**: 3-of-5 signatures required
- **Custodian Multi-Sig**: 2-of-3 signatures required
- **Key Distribution**: Distribute keys securely
- **Backup Procedures**: Document backup procedures

### Access Control
- **Owner Functions**: Only callable by owner multi-sig
- **Custodian Functions**: Only callable by custodian multi-sig
- **User Functions**: Public with proper validation
- **Emergency Functions**: Available for crisis situations

### Monitoring and Alerting
- **Transaction Monitoring**: Monitor all contract transactions
- **Event Monitoring**: Monitor all contract events
- **Gas Monitoring**: Monitor gas usage patterns
- **Error Monitoring**: Monitor failed transactions

## Emergency Procedures

### Contract Pause
```javascript
// Pause contract in emergency
await wacg.pause();

// Unpause when safe
await wacg.unpause();
```

### Emergency Recovery
```javascript
// Recover stuck tokens
await wacg.emergencyRecoverERC20(tokenAddress, recipient, amount);

// Emergency mint (custodian only)
await wacg.emergencyMint(recipient, amount);
```

### Custodian Change
```javascript
// Change custodian (owner only)
await wacg.changeCustodian(newCustodianAddress);
```

## Gas Optimization

### Deployment Gas
- **Estimated Cost**: ~2,000,000 gas
- **Estimated Cost**: ~0.01 BNB (at 5 Gwei)

### Function Gas Costs
- **Wrap**: ~150,000 gas
- **Unwrap**: ~120,000 gas
- **Emergency Mint**: ~80,000 gas
- **Pause/Unpause**: ~30,000 gas

### Gas Optimization Tips
- Use efficient data structures
- Minimize storage operations
- Optimize function parameters
- Use appropriate gas limits

## Troubleshooting

### Common Issues

#### Deployment Fails
- **Insufficient BNB**: Ensure deployment wallet has enough BNB
- **Network Issues**: Check BSC network connectivity
- **Gas Issues**: Increase gas limit if needed

#### Verification Fails
- **Constructor Args**: Verify constructor arguments
- **Compiler Version**: Ensure correct Solidity version
- **Optimization**: Match optimization settings

#### Function Calls Fail
- **Access Control**: Check caller permissions
- **Input Validation**: Verify input parameters
- **State Conditions**: Check contract state

### Support Resources
- **Documentation**: [README.md](README.md)
- **Security**: [SECURITY.md](SECURITY.md)
- **Issues**: GitHub Issues
- **Support**: support@aurumcryptogold.com

## Maintenance

### Regular Tasks
- **Monitoring**: Daily contract monitoring
- **Backups**: Regular configuration backups
- **Updates**: Security updates and patches
- **Audits**: Regular security audits

### Performance Monitoring
- **Gas Usage**: Monitor gas consumption
- **Transaction Volume**: Track usage patterns
- **Error Rates**: Monitor failed transactions
- **User Feedback**: Collect user feedback

## Conclusion

Following this deployment guide ensures a secure and successful deployment of the Wrapped ACG contract to BSC mainnet. Remember to:

1. **Test thoroughly** before mainnet deployment
2. **Use multi-sig wallets** for security
3. **Monitor continuously** after deployment
4. **Have emergency procedures** ready
5. **Document everything** for future reference

For additional support, contact the development team at support@aurumcryptogold.com.

---

**Last Updated**: December 2024
**Version**: 1.0.0 