# wACG Contract Improvements for Bridge Integration

## 🔍 Analysis Summary

After reviewing the original wACG contract, I've identified several areas that need enhancement for proper bridge backend integration. The original contract was well-designed for direct user interaction but lacked bridge-specific functionality.

## ✅ Original Contract Strengths

1. **Solid Security Foundation**: ReentrancyGuard, Pausable, Ownable
2. **Request Deduplication**: Prevents duplicate wrap/unwrap requests
3. **Comprehensive Input Validation**: Custom errors, address/amount validation
4. **Emergency Controls**: Pause, recovery, emergency mint with lock
5. **Rate Limiting**: Daily limits per address
6. **Audit Ready**: Has been audited and deemed production-ready

## 🚀 Key Improvements Made

### 1. **Bridge Operator Role** 🔧
- **Added**: Dedicated `bridgeOperator` role for backend integration
- **Replaced**: `custodian` with `bridgeOperator` for clarity
- **Security**: Only bridge operator can perform bridge-controlled operations
- **Flexibility**: Owner can change bridge operator address

### 2. **Bridge-Controlled Functions** 🌉
- **Added**: `bridgeMint()` - Backend-controlled minting for wrapping
- **Added**: `bridgeBurn()` - Backend-controlled burning for unwrapping
- **Benefits**: 
  - Backend can mint tokens after verifying ACG deposits
  - Backend can burn tokens when users request unwrapping
  - Better control over the bridge workflow
  - Enhanced security through backend validation

### 3. **EIP-2612 Permit Support** ⚡
- **Added**: Full EIP-2612 permit functionality
- **Benefits**:
  - Gasless approvals for better UX
  - Users can approve bridge operator without gas fees
  - Standard compliance for modern DeFi protocols
  - Enhanced interoperability

### 4. **Enhanced burnFrom Support** 🔥
- **Added**: `bridgeBurn()` function with proper allowance checking
- **Security**: Bridge operator must be approved to burn user tokens
- **Workflow**: 
  1. User approves bridge operator
  2. User requests unwrap through backend
  3. Backend calls `bridgeBurn()` with proper allowance
  4. Tokens are burned and ACG sent to user

### 5. **Improved Event System** 📊
- **Added**: `BridgeMint` and `BridgeBurn` events
- **Benefits**: Clear distinction between user-initiated and bridge-initiated operations
- **Monitoring**: Better tracking for bridge operations

### 6. **Enhanced Error Handling** 🛡️
- **Added**: `InsufficientAllowance` error for bridge operations
- **Improved**: Better error messages for bridge-specific scenarios

## 🔄 Bridge Integration Workflow

### Wrapping Flow (ACG → wACG)
1. **User**: Sends ACG to bridge deposit address on ACG chain
2. **Backend**: Monitors ACG chain for deposits
3. **Backend**: Validates deposit and calls `bridgeMint()`
4. **Contract**: Mints wACG tokens to user's BSC address
5. **Event**: `BridgeMint` event emitted for tracking

### Unwrapping Flow (wACG → ACG)
1. **User**: Approves bridge operator (can use permit for gasless)
2. **User**: Requests unwrap through backend
3. **Backend**: Validates request and calls `bridgeBurn()`
4. **Contract**: Burns wACG tokens from user
5. **Backend**: Sends ACG tokens to user's ACG address
6. **Event**: `BridgeBurn` event emitted for tracking

## 📋 Contract Functions Overview

### Bridge Functions (New)
```solidity
function bridgeMint(address to, uint256 amount, string calldata acgTxHash, bytes32 requestId)
function bridgeBurn(address from, uint256 amount, string calldata acgAddress, bytes32 requestId)
```

### Legacy Functions (Maintained)
```solidity
function wrap(address to, uint256 amount, string calldata acgTxHash)
function unwrap(address from, uint256 amount, string calldata acgAddress)
```

### Admin Functions (Enhanced)
```solidity
function changeBridgeOperator(address newBridgeOperator)
function emergencyMint(address to, uint256 amount)
// ... other admin functions remain the same
```

### EIP-2612 Functions (New)
```solidity
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)
```

## 🔒 Security Enhancements

### 1. **Role Separation**
- **Owner**: Controls contract parameters, emergency functions
- **Bridge Operator**: Handles bridge-specific operations
- **Users**: Can still use legacy functions if needed

### 2. **Allowance Management**
- Bridge operator must be approved to burn user tokens
- Prevents unauthorized token burning
- Users maintain control over their tokens

### 3. **Request Deduplication**
- Enhanced with bridge-specific request IDs
- Prevents replay attacks across different operation types

### 4. **Enhanced Validation**
- Bridge-specific parameter validation
- Improved error handling for bridge operations

## 🚀 Deployment Recommendations

### Constructor Parameters
```solidity
constructor(
    address _bridgeOperator,    // Bridge backend address
    address _owner,            // Contract owner
    uint256 _maxWrapAmount,    // Max wrap per transaction
    uint256 _maxUnwrapAmount,  // Max unwrap per transaction
    uint256 _minAmount,        // Minimum transaction amount
    uint256 _dailyWrapLimit,   // Daily wrap limit per address
    uint256 _dailyUnwrapLimit  // Daily unwrap limit per address
)
```

### Recommended Values
- **Bridge Operator**: Backend wallet address
- **Max Wrap/Unwrap**: 1,000,000 ACG (100,000,000,000 in smallest units)
- **Min Amount**: 0.00000001 ACG (1 in smallest units)
- **Daily Limits**: 10,000,000 ACG (1,000,000,000,000 in smallest units)

## 📊 Backend Integration Points

### 1. **Event Monitoring**
```javascript
// Monitor bridge events
contract.on('BridgeMint', (to, amount, acgTxHash, requestId) => {
    // Update database, send notifications
});

contract.on('BridgeBurn', (from, amount, acgAddress, requestId) => {
    // Initiate ACG transfer, update database
});
```

### 2. **Function Calls**
```javascript
// Bridge minting
await contract.bridgeMint(userAddress, amount, acgTxHash, requestId);

// Bridge burning
await contract.bridgeBurn(userAddress, amount, acgAddress, requestId);
```

### 3. **Allowance Management**
```javascript
// Check allowance
const allowance = await contract.allowance(userAddress, bridgeOperatorAddress);

// User can approve via permit (gasless)
const permit = await contract.permit(owner, spender, value, deadline, v, r, s);
```

## 🎯 Benefits of Improvements

1. **Better Bridge Integration**: Dedicated functions for backend operations
2. **Enhanced Security**: Role separation and allowance management
3. **Improved UX**: Gasless approvals via EIP-2612
4. **Backward Compatibility**: Legacy functions still available
5. **Better Monitoring**: Enhanced event system for bridge operations
6. **Future-Proof**: Ready for advanced bridge features

## 🔄 Migration Path

1. **Deploy**: New improved contract
2. **Configure**: Set bridge operator to backend address
3. **Test**: Verify all bridge operations work correctly
4. **Migrate**: Gradually move users to bridge-controlled operations
5. **Monitor**: Track bridge events and performance

The improved contract maintains all security features of the original while adding essential bridge functionality for seamless backend integration. 