# wACG Contract Deployment Guide

## Overview
This guide covers deploying the simplified WrappedACG contract to BSC Testnet.

## Contract Features
- **Standard ERC20** with 8 decimals (matching ACG)
- **Bridge-controlled minting** via `bridgeMint()`
- **Bridge-controlled burning** via `bridgeBurn()`
- **Request deduplication** to prevent double processing
- **Pausable** for emergency situations
- **Ownable** for admin functions

## Prerequisites

### 1. Environment Setup
Create a `.env` file in the `wACG` directory:

```env
# BSC Testnet Deployment Configuration
PRIVATE_KEY=your_private_key_here
BSCSCAN_API_KEY=your_bscscan_api_key_here

# Bridge Configuration
BRIDGE_OPERATOR=0x1234567890123456789012345678901234567890
OWNER_ADDRESS=0x1234567890123456789012345678901234567890

# Optional: Gas reporting
REPORT_GAS=true
```

### 2. BSC Testnet BNB
Get test BNB from the [BSC Testnet Faucet](https://testnet.binance.org/faucet-smart)

### 3. Dependencies
```bash
npm install
```

## Deployment Steps

### 1. Compile Contract
```bash
npx hardhat compile
```

### 2. Run Tests
```bash
npx hardhat test
```

### 3. Deploy to BSC Testnet
```bash
npx hardhat run deploy-testnet.js --network bscTestnet
```

### 4. Verify Contract
```bash
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> "<BRIDGE_OPERATOR>" "<OWNER_ADDRESS>"
```

## Contract Functions

### Bridge Functions
- `bridgeMint(address to, uint256 amount, string acgTxHash, bytes32 requestId)`
- `bridgeBurn(address from, uint256 amount, string acgAddress, bytes32 requestId)`

### Admin Functions
- `updateBridgeOperator(address newOperator)`
- `pause()`
- `unpause()`

### View Functions
- `isRequestProcessed(bytes32 requestId)`
- `bridgeOperator()`
- `owner()`
- `paused()`

## Security Features

### Access Control
- Only `bridgeOperator` can mint/burn tokens
- Only `owner` can update bridge operator and pause/unpause
- Request deduplication prevents double processing

### Safety Features
- `ReentrancyGuard` prevents reentrancy attacks
- `Pausable` allows emergency pausing
- Input validation for addresses and amounts

## Integration with Bridge Backend

### Required Environment Variables
Update your bridge backend `.env`:

```env
# wACG Contract
WACG_CONTRACT_ADDRESS=<deployed_contract_address>
BRIDGE_OPERATOR_PRIVATE_KEY=<your_bridge_operator_private_key>
BSC_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
```

### Backend Integration Points
1. **Wrap Flow**: Call `bridgeMint()` after ACG deposit verification
2. **Unwrap Flow**: Call `bridgeBurn()` before sending ACG to user
3. **Request Tracking**: Use `isRequestProcessed()` to prevent duplicates

## Testing

### Local Testing
```bash
npx hardhat test
```

### Testnet Testing
1. Deploy contract
2. Test `bridgeMint()` with small amounts
3. Test `bridgeBurn()` with small amounts
4. Verify events are emitted correctly
5. Test pause/unpause functionality

## Monitoring

### Events to Monitor
- `BridgeMint(address indexed to, uint256 amount, string acgTxHash, bytes32 requestId, uint256 timestamp)`
- `BridgeBurn(address indexed from, uint256 amount, string acgAddress, bytes32 requestId, uint256 timestamp)`
- `BridgeOperatorUpdated(address indexed oldOperator, address indexed newOperator)`

### BSCScan Integration
- Monitor contract on [BSCScan Testnet](https://testnet.bscscan.com/)
- Set up event monitoring for bridge operations
- Track token transfers and approvals

## Troubleshooting

### Common Issues
1. **Insufficient BNB**: Get test BNB from faucet
2. **Gas Price**: Adjust in `hardhat.config.js` if needed
3. **Network Issues**: Check BSC testnet RPC endpoint
4. **Verification Failed**: Ensure constructor parameters match

### Support
- Check [BSC Documentation](https://docs.binance.org/)
- Review [Hardhat Documentation](https://hardhat.org/docs)
- Monitor BSC testnet status

## Next Steps
1. Test thoroughly on testnet
2. Deploy to mainnet when ready
3. Update bridge backend configuration
4. Monitor bridge operations
5. Set up alerts for critical events 