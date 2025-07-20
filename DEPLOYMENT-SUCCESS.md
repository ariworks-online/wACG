# 🎉 wACG Contract Deployment Success!

## Deployment Summary

**Date**: July 18, 2025  
**Network**: BSC Testnet  
**Status**: ✅ Successfully Deployed and Verified

---

## Contract Addresses

### Main Contract (Proxy)
- **Address**: `0xda83b336e6a30F730E29C901CF6E24e6285B4E79`
- **Type**: TransparentUpgradeableProxy
- **Purpose**: This is the main contract address that users and frontend will interact with
- **BSCScan**: https://testnet.bscscan.com/address/0xda83b336e6a30F730E29C901CF6E24e6285B4E79

### Implementation Contract
- **Address**: `0x808890cF5DB1FBAaCbC957a771A06d0a4e659E0b`
- **Type**: WrappedACGUpgradeable
- **Purpose**: Contains the actual contract logic
- **BSCScan**: https://testnet.bscscan.com/address/0x808890cF5DB1FBAaCbC957a771A06d0a4e659E0b#code
- **Status**: ✅ Verified

### Admin Contract
- **Address**: `0xdfB1637569090Ee5A20Be0ebA9c3956f411649B7`
- **Type**: ProxyAdmin
- **Purpose**: Manages proxy upgrades
- **BSCScan**: https://testnet.bscscan.com/address/0xdfB1637569090Ee5A20Be0ebA9c3956f411649B7

---

## Contract Details

| Property | Value |
|----------|-------|
| **Name** | Wrapped ACG |
| **Symbol** | wACG |
| **Decimals** | 8 |
| **Version** | 1.0.0 |
| **Bridge Operator** | `0xA3f3ECF8b52D90712Eb033357Bc4d1730282C59B` |
| **Owner** | `0xA3f3ECF8b52D90712Eb033357Bc4d1730282C59B` |
| **Paused** | false |
| **Total Supply** | 0 |

---

## Transaction Details

- **Deployment TX**: `0xb0f451284127aae8d7209fbb7f6a53ba7185c429196ba6d1ed22433a414b0dd4`
- **Deployer**: `0xA3f3ECF8b52D90712Eb033357Bc4d1730282C59B`
- **Gas Used**: ~3.4M gas
- **Deployer Balance**: 0.1683968835 BNB

---

## Key Features

✅ **Upgradeable**: Can be upgraded without changing the proxy address  
✅ **Bridge-Controlled**: Only bridge operator can mint/burn tokens  
✅ **8 Decimals**: Matches ACG token precision  
✅ **Security**: ReentrancyGuard, Pausable, request deduplication  
✅ **Latest Tech**: OpenZeppelin v5, ethers v6, Hardhat v2.19  

---

## Environment Variables

Add these to your `.env` file:

```env
# Deployed Contract Addresses
WACG_PROXY_ADDRESS=0xda83b336e6a30F730E29C901CF6E24e6285B4E79
WACG_IMPLEMENTATION_ADDRESS=0x808890cF5DB1FBAaCbC957a771A06d0a4e659E0b
WACG_ADMIN_ADDRESS=0xdfB1637569090Ee5A20Be0ebA9c3956f411649B7
```

---

## Next Steps

### 1. Frontend Integration
- Use `WACG_PROXY_ADDRESS` as the contract address
- Import the contract ABI from `artifacts/contracts/WrappedACGUpgradeable.sol/WrappedACGUpgradeable.json`

### 2. Backend Integration
- Update your bridge backend to use the proxy address
- Implement `bridgeMint` and `bridgeBurn` function calls
- Use the bridge operator private key for transactions

### 3. Testing
- Test `bridgeMint` function with small amounts
- Test `bridgeBurn` function
- Verify events are emitted correctly
- Test pause/unpause functionality

### 4. Mainnet Deployment
- Deploy to BSC mainnet using the same process
- Update environment variables for mainnet
- Verify contracts on mainnet BSCScan

---

## Contract Functions

### Bridge Functions (Bridge Operator Only)
```solidity
function bridgeMint(
    address to,
    uint256 amount,
    string calldata acgTxHash,
    bytes32 requestId
) external

function bridgeBurn(
    address from,
    uint256 amount,
    string calldata acgTargetAddress,
    bytes32 requestId
) external
```

### Admin Functions (Owner Only)
```solidity
function updateBridgeOperator(address newOperator) external
function pause() external
function unpause() external
```

### View Functions
```solidity
function bridgeOperator() external view returns (address)
function owner() external view returns (address)
function paused() external view returns (bool)
function isRequestProcessed(bytes32 requestId) external view returns (bool)
function version() external pure returns (string memory)
```

---

## Security Notes

- **Bridge Operator**: Only the bridge operator can mint/burn tokens
- **Request Deduplication**: Each request ID can only be processed once
- **Pausable**: Contract can be paused in emergency situations
- **Upgradeable**: Contract can be upgraded while maintaining state
- **Reentrancy Protection**: All state-changing functions are protected

---

## Future Upgrades

To upgrade the contract in the future:

1. Deploy new implementation contract
2. Use the admin contract to upgrade the proxy
3. The proxy address remains the same
4. Users don't need to update their configurations

---

## Support

For technical support or questions about the deployment:
- Check the contract code on BSCScan
- Review the deployment logs
- Test functions on testnet before mainnet

---

**🎉 Congratulations! Your wACG contract is now live on BSC Testnet!** 