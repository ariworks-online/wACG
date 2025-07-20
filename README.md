# Wrapped ACG (wACG) Smart Contract

## Overview

Wrapped ACG (wACG) is an ERC-20 token that represents ACG tokens on the Binance Smart Chain (BSC). It enables cross-chain functionality between the ACG blockchain and BSC, allowing users to bridge their ACG tokens between networks.

## AUDIT REPORT
**Latest Audit Report**: [AUDIT-REPORT-V2.md](AUDIT-REPORT-V2.md)  
**Previous Audit**: [AUDIT-REPORT.md](AUDIT-REPORT.md)

**Security Rating**: 🟡 **MEDIUM-HIGH**  
**Audit Date**: July 20, 2025  
**Auditor**: YesChat AI Security Analysis

## Contract Information

- **Contract Name**: WrappedACG
- **Token Name**: Wrapped ACG
- **Token Symbol**: wACG
- **Decimals**: 8 (matching ACG blockchain)
- **Version**: 1.1.0
- **License**: MIT
- **Network**: Binance Smart Chain (BSC)
- **Proxy Address**: `0xD774b89a621C2a6595b80CE260F7165a9A7A3846`
- **Implementation**: `0xc12d5290b25Ec7132845f91f9729fB1AF92cf233`
- **BSCscan**: [Verified Contract](https://bscscan.com/address/0xD774b89a621C2a6595b80CE260F7165a9A7A3846)

## Security Features

### Core Security
- **ReentrancyGuard**: Prevents reentrancy attacks on wrap/unwrap functions
- **Pausable**: Emergency pause functionality for all operations
- **Ownable**: Restricted admin functions with proper access control
- **SafeERC20**: Safe token transfer operations
- **UUPS Upgradeable**: Secure upgradeable proxy pattern
- **Replay Protection**: `usedWrapIds` mapping prevents duplicate operations
- **Supply Control**: `maxSupply` enforced to prevent unlimited minting

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
address public bridgeOperator;              // Bridge operations handler
address public owner;                       // Contract owner
address public emergencyRecovery;           // Emergency recovery address
uint256 public maxSupply;                   // Maximum total supply
uint256 public dailyMintLimit;              // Daily mint limit per address
uint256 public dailyBurnLimit;              // Daily burn limit per address
uint256 public totalACGWrapped;             // Total ACG wrapped
uint256 public totalACGUnwrapped;           // Total ACG unwrapped
mapping(bytes32 => bool) public usedWrapIds; // Request deduplication
```

### Core Functions

#### Mint Function (Bridge Operator)
```solidity
function mint(address to, uint256 amount, bytes32 wrapId)
```
- Mints wACG tokens to the specified address
- Requires unique wrapId to prevent replay attacks
- Enforces daily mint limits and max supply
- Only callable by bridge operator

#### Unwrap Function
```solidity
function unwrap(uint256 amount, string calldata acgAddress)
```
- Burns wACG tokens from the sender
- Requires ACG address for receiving unwrapped tokens
- Enforces daily burn limits
- Deducts unwrap fee to fee collector

### Admin Functions

#### Bridge Operator Management
```solidity
function changeBridgeOperator(address newBridgeOperator)
```
- Owner-only function to change bridge operator address
- Emits event for transparency

#### Limit Management
```solidity
function updateDailyLimits(uint256 _dailyMintLimit, uint256 _dailyBurnLimit)
```
- Owner-only function to update daily limits
- Emits event for transparency

#### Emergency Functions
```solidity
function emergencyMint(address to, uint256 amount)
function emergencyRecoverERC20(address token, address to, uint256 amount)
function pause() / unpause()
```
- Emergency functions for recovery scenarios
- Emergency mint restricted to emergency recovery address
- Pause/unpause restricted to owner

## Events

### Core Events
- `WrapCompleted(address indexed to, uint256 amount, bytes32 indexed wrapId)`
- `UnwrapRequested(address indexed from, uint256 amount, string acgAddress)`

### Admin Events
- `BridgeOperatorChanged(address indexed oldOperator, address indexed newOperator)`
- `DailyLimitsUpdated(uint256 dailyMintLimit, uint256 dailyBurnLimit)`
- `EmergencyRecovery(address indexed token, address indexed to, uint256 amount)`

## Error Handling

The contract uses custom errors for gas efficiency and better error handling:

```solidity
error InvalidAddress();
error InvalidAmount();
error InsufficientBalance();
error WrapIdAlreadyUsed();
error DailyLimitExceeded();
error AmountExceedsMaxSupply();
error OnlyBridgeOperator();
error OnlyOwner();
error InvalidACGAddress();
error Paused();
```

## Deployment Parameters

### Constructor Parameters
```solidity
constructor(
    address _bridgeOperator,    // Bridge operator address for minting
    address _owner,            // Contract owner address
    address _emergencyRecovery, // Emergency recovery address
    uint256 _maxSupply,        // Maximum total supply
    uint256 _dailyMintLimit,   // Daily mint limit per address
    uint256 _dailyBurnLimit    // Daily burn limit per address
)
```

### Current Deployment Values
- **Bridge Operator**: `0xE70D19b3B88cB79E62962D86d284af6f6269864C`
- **Owner**: `0xE70D19b3B88cB79E62962D86d284af6f6269864C`
- **Emergency Recovery**: `0x65d3083F153372940149b41E820457253d14Ab0E`
- **Max Supply**: 51,940,422 ACG (total ACG supply)
- **Daily Mint Limit**: 100,000 ACG per address
- **Daily Burn Limit**: 100,000 ACG per address

## Integration Guide

### Frontend Integration

#### Wrapping ACG to wACG
```javascript
// 1. User sends ACG to bridge operator on ACG blockchain
// 2. Bridge operator calls mint function on BSC
const tx = await wacgContract.mint(
    userAddress,           // Recipient address
    amountInSmallestUnit,  // Amount in smallest unit (8 decimals)
    wrapId                 // Unique wrap ID to prevent replay
);
```

#### Unwrapping wACG to ACG
```javascript
// 1. User calls unwrap function on BSC
const tx = await wacgContract.unwrap(
    amountInSmallestUnit,  // Amount in smallest unit (8 decimals)
    acgAddress            // ACG address to receive tokens
);
// 2. Backend detects UnwrapRequested event and sends ACG tokens
```

### Backend Integration

#### Monitoring Events
```javascript
// Monitor WrapCompleted events
wacgContract.on('WrapCompleted', (to, amount, wrapId) => {
    // Log successful wrap operations
});

// Monitor UnwrapRequested events
wacgContract.on('UnwrapRequested', (from, amount, acgAddress) => {
    // Send ACG tokens to the specified address
});
```

## Audit Considerations

### Security Checklist
- [x] Reentrancy protection on all state-changing functions
- [x] Access control for admin functions
- [x] Input validation for all parameters
- [x] Replay protection with usedWrapIds mapping
- [x] Emergency pause functionality
- [x] Daily rate limiting to prevent abuse
- [x] Proper event emission for transparency
- [x] Safe token transfer operations
- [x] Zero address checks
- [x] Supply control with maxSupply enforcement
- [x] UUPS upgradeable pattern with proper authorization

### Known Limitations
- Bridge operator has minting capability (necessary for bridge operations)
- Owner can change daily limits (necessary for operational flexibility)
- Daily limits reset at midnight UTC
- Wrap IDs include chain ID for cross-chain safety
- Fee configuration requires contract upgrade (addressed in audit recommendations)

### Risk Mitigation
- Bridge operator should be upgraded to multi-sig wallet (recommended in audit)
- Owner address should be a multi-sig wallet
- Emergency recovery address is multi-sig protected
- Regular monitoring of contract events via Tenderly
- Emergency procedures documented
- Regular security audits recommended
- Real-time alerting for suspicious activities

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
BRIDGE_OPERATOR_ADDRESS=your_bridge_operator_address
OWNER_ADDRESS=your_owner_address
EMERGENCY_RECOVERY_ADDRESS=your_emergency_recovery_address
```

## Monitoring

### Key Metrics to Monitor
- Total ACG wrapped/unwrapped
- Daily transaction volumes
- Failed transactions
- Gas usage patterns
- Contract events
- Bridge operator activities
- Emergency function usage

### Alerting
- Unusual transaction volumes
- Failed wrap/unwrap attempts
- Bridge operator changes
- Limit updates
- Emergency functions called
- Large value transactions (>10K ACG)
- Bridge operator activity

## Support

### Contact Information
- **Security**: dev@aurumcryptogold.com
- **Technical Support**: dev@aurumcryptogold.com
- **Developer**: hi@ariworks.online

### Emergency Procedures
1. Pause contract if suspicious activity detected
2. Contact security team immediately
3. Investigate and resolve issue
4. Unpause contract when safe

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This software is provided "as is" without warranty of any kind. Users should conduct their own security audits and due diligence before using this contract. 