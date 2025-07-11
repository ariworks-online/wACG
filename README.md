# Wrapped ACG (wACG) Smart Contract

## Overview

Wrapped ACG (wACG) is an ERC-20 token that represents ACG tokens on the Binance Smart Chain (BSC). It enables cross-chain functionality between the ACG blockchain and BSC, allowing users to bridge their ACG tokens between networks.

## Contract Information

- **Contract Name**: WrappedACG
- **Token Name**: Wrapped ACG
- **Token Symbol**: wACG
- **Decimals**: 8 (matching ACG blockchain)
- **Version**: 1.0.0
- **License**: MIT
- **Network**: Binance Smart Chain (BSC)

## Security Features

### Core Security
- **ReentrancyGuard**: Prevents reentrancy attacks on wrap/unwrap functions
- **Pausable**: Emergency pause functionality for all operations
- **Ownable**: Restricted admin functions with proper access control
- **SafeERC20**: Safe token transfer operations

### Request Deduplication
- Unique request IDs prevent duplicate wrap/unwrap operations
- Chain ID included in request ID generation for cross-chain safety
- Persistent storage of processed requests

### Input Validation
- Comprehensive parameter validation for all functions
- Zero address checks
- Amount validation (minimum and maximum limits)
- ACG transaction hash and address validation

### Rate Limiting
- Daily limits per address for wrap/unwrap operations
- Configurable transaction limits
- Prevents abuse and ensures fair usage

### Emergency Functions
- Emergency mint for custodian (for recovery scenarios)
- Emergency token recovery for stuck ERC20 tokens
- Pause/unpause functionality

## Contract Architecture

### State Variables
```solidity
address public custodian;                    // Cross-chain operations handler
uint256 public totalACGWrapped;             // Total ACG wrapped
uint256 public totalACGUnwrapped;           // Total ACG unwrapped
uint256 public maxWrapAmount;               // Max wrap per transaction
uint256 public maxUnwrapAmount;             // Max unwrap per transaction
uint256 public minAmount;                   // Minimum transaction amount
uint256 public dailyWrapLimit;              // Daily wrap limit per address
uint256 public dailyUnwrapLimit;            // Daily unwrap limit per address
mapping(bytes32 => bool) public processedRequests;  // Request deduplication
```

### Core Functions

#### Wrap Function
```solidity
function wrap(address to, uint256 amount, string calldata acgTxHash)
```
- Mints wACG tokens to the specified address
- Requires valid ACG transaction hash as proof
- Enforces daily and transaction limits
- Prevents duplicate requests

#### Unwrap Function
```solidity
function unwrap(address from, uint256 amount, string calldata acgAddress)
```
- Burns wACG tokens from the sender
- Requires ACG address for receiving unwrapped tokens
- Enforces daily and transaction limits
- Prevents duplicate requests

### Admin Functions

#### Custodian Management
```solidity
function changeCustodian(address newCustodian)
```
- Owner-only function to change custodian address
- Emits event for transparency

#### Limit Management
```solidity
function updateLimits(uint256 _maxWrapAmount, uint256 _maxUnwrapAmount, uint256 _minAmount)
function updateDailyLimits(uint256 _dailyWrapLimit, uint256 _dailyUnwrapLimit)
```
- Owner-only functions to update transaction and daily limits
- Emit events for transparency

#### Emergency Functions
```solidity
function emergencyMint(address to, uint256 amount)
function emergencyRecoverERC20(address token, address to, uint256 amount)
function pause() / unpause()
```
- Emergency functions for recovery scenarios
- Restricted access control

## Events

### Core Events
- `ACGWrapped(address indexed to, uint256 amount, string acgTxHash, bytes32 indexed requestId)`
- `ACGUnwrapped(address indexed from, uint256 amount, string acgAddress, bytes32 indexed requestId)`

### Admin Events
- `CustodianChanged(address indexed oldCustodian, address indexed newCustodian)`
- `LimitsUpdated(uint256 maxWrapAmount, uint256 maxUnwrapAmount, uint256 minAmount)`
- `DailyLimitsUpdated(uint256 dailyWrapLimit, uint256 dailyUnwrapLimit)`
- `EmergencyRecovery(address indexed token, address indexed to, uint256 amount)`

## Error Handling

The contract uses custom errors for gas efficiency and better error handling:

```solidity
error InvalidAddress();
error InvalidAmount();
error InsufficientBalance();
error RequestAlreadyProcessed();
error DailyLimitExceeded();
error AmountExceedsMaxLimit();
error AmountBelowMinLimit();
error OnlyCustodian();
error InvalidACGAddress();
error InvalidACGTxHash();
```

## Deployment Parameters

### Constructor Parameters
```solidity
constructor(
    address _custodian,        // Custodian address for cross-chain operations
    address _owner,           // Contract owner address
    uint256 _maxWrapAmount,   // Maximum wrap amount per transaction
    uint256 _maxUnwrapAmount, // Maximum unwrap amount per transaction
    uint256 _minAmount,       // Minimum transaction amount
    uint256 _dailyWrapLimit,  // Daily wrap limit per address
    uint256 _dailyUnwrapLimit // Daily unwrap limit per address
)
```

### Recommended Initial Values
- **Max Wrap Amount**: 1,000,000 ACG (100,000,000,000 in smallest units)
- **Max Unwrap Amount**: 1,000,000 ACG (100,000,000,000 in smallest units)
- **Min Amount**: 0.00000001 ACG (1 in smallest units)
- **Daily Wrap Limit**: 10,000,000 ACG (1,000,000,000,000 in smallest units)
- **Daily Unwrap Limit**: 10,000,000 ACG (1,000,000,000,000 in smallest units)

## Integration Guide

### Frontend Integration

#### Wrapping ACG to wACG
```javascript
// 1. User sends ACG to custodian address on ACG blockchain
// 2. User calls wrap function on BSC
const tx = await wacgContract.wrap(
    userAddress,           // Recipient address
    amountInSmallestUnit,  // Amount in smallest unit (8 decimals)
    acgTransactionHash     // ACG transaction hash as proof
);
```

#### Unwrapping wACG to ACG
```javascript
// 1. User calls unwrap function on BSC
const tx = await wacgContract.unwrap(
    userAddress,           // Sender address (must be msg.sender)
    amountInSmallestUnit,  // Amount in smallest unit (8 decimals)
    acgAddress            // ACG address to receive tokens
);
// 2. Backend detects burn event and sends ACG tokens
```

### Backend Integration

#### Monitoring Events
```javascript
// Monitor ACGWrapped events
wacgContract.on('ACGWrapped', (to, amount, acgTxHash, requestId) => {
    // Verify ACG transaction and mint wACG tokens
});

// Monitor ACGUnwrapped events
wacgContract.on('ACGUnwrapped', (from, amount, acgAddress, requestId) => {
    // Send ACG tokens to the specified address
});
```

## Audit Considerations

### Security Checklist
- [x] Reentrancy protection on all state-changing functions
- [x] Access control for admin functions
- [x] Input validation for all parameters
- [x] Request deduplication to prevent double-spending
- [x] Emergency pause functionality
- [x] Rate limiting to prevent abuse
- [x] Proper event emission for transparency
- [x] Safe token transfer operations
- [x] Zero address checks
- [x] Amount validation (minimum/maximum limits)

### Known Limitations
- Custodian has emergency mint capability (necessary for recovery)
- Owner can change limits (necessary for operational flexibility)
- Daily limits reset at midnight UTC
- Request IDs include chain ID for cross-chain safety

### Risk Mitigation
- Custodian address should be a multi-sig wallet
- Owner address should be a multi-sig wallet
- Regular monitoring of contract events
- Emergency procedures documented
- Regular security audits recommended

## Testing

### Unit Tests
Run the test suite:
```bash
npm test
```

### Test Coverage
Ensure 100% test coverage for all functions:
```bash
npm run coverage
```

### Integration Tests
Test with mainnet forking:
```bash
npm run test:integration
```

## Deployment

### Prerequisites
- Node.js 16+
- Hardhat
- BSC network configuration
- Deployment wallet with BNB for gas

### Deployment Steps
1. Set environment variables
2. Compile contracts
3. Deploy with proper constructor parameters
4. Verify contract on BSCScan
5. Update frontend configuration
6. Test all functions

### Environment Variables
```bash
BSC_PRIVATE_KEY=your_private_key
BSC_RPC_URL=https://bsc-dataseed.binance.org/
CUSTODIAN_ADDRESS=your_custodian_address
OWNER_ADDRESS=your_owner_address
```

## Monitoring

### Key Metrics to Monitor
- Total ACG wrapped/unwrapped
- Daily transaction volumes
- Failed transactions
- Gas usage patterns
- Contract events

### Alerting
- Unusual transaction volumes
- Failed wrap/unwrap attempts
- Custodian changes
- Limit updates
- Emergency functions called

## Support

### Contact Information
- **Security**: security@aurumcryptogold.com
- **Technical Support**: support@aurumcryptogold.com
- **Documentation**: https://docs.aurumcryptogold.com

### Emergency Procedures
1. Pause contract if suspicious activity detected
2. Contact security team immediately
3. Investigate and resolve issue
4. Unpause contract when safe

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This software is provided "as is" without warranty of any kind. Users should conduct their own security audits and due diligence before using this contract. 