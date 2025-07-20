// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title WrappedACG
 * @dev Simplified wACG token for ACG Bridge - Only essential mint/burn functions
 * 
 * Features:
 * - OpenZeppelin ERC20 standard
 * - Only mint(address, amount) and burnFrom(address, amount) functions
 * - Restricted to bridge operator (backend system wallet)
 * - Events for minting and burning
 * - Upgradable contract
 * - 8 decimal places (matching ACG)
 * 
 * @author Aurum Crypto Gold Team
 * @notice This contract enables wrapping ACG tokens from ACG blockchain to wACG on BSC
 * @custom:security-contact security@aurumcryptogold.com
 */
contract WrappedACG is ERC20, Ownable, Pausable, ReentrancyGuard, Initializable, UUPSUpgradeable {
    
    // ============ STATE VARIABLES ============
    
    /// @notice Bridge operator address that can mint and burn tokens
    address public bridgeOperator;
    
    /// @notice Total ACG tokens wrapped (in smallest unit - 8 decimals)
    uint256 public totalACGWrapped;
    
    /// @notice Total ACG tokens unwrapped (in smallest unit - 8 decimals)
    uint256 public totalACGUnwrapped;
    
    /// @notice Contract version
    string public constant VERSION = "1.0.0";

    // ============ EVENTS ============
    
    event BridgeOperatorChanged(address indexed oldOperator, address indexed newOperator);
    event ACGMinted(address indexed to, uint256 amount, uint256 timestamp);
    event ACGBurned(address indexed from, uint256 amount, uint256 timestamp);

    // ============ ERRORS ============
    
    error InvalidAddress();
    error InvalidAmount();
    error OnlyBridgeOperator();
    error InsufficientBalance();

    // ============ MODIFIERS ============
    
    /**
     * @dev Modifier to restrict function to bridge operator only
     */
    modifier onlyBridgeOperator() {
        if (msg.sender != bridgeOperator) revert OnlyBridgeOperator();
        _;
    }

    /**
     * @dev Modifier to validate address is not zero
     */
    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    /**
     * @dev Modifier to validate amount is greater than zero
     */
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    // ============ CONSTRUCTOR (for implementation) ============
    
    /**
     * @dev Constructor for implementation contract
     */
    constructor() ERC20("Wrapped ACG", "wACG") {
        _disableInitializers();
    }

    // ============ INITIALIZER ============
    
    /**
     * @dev Initialize function for proxy deployment
     * @param _bridgeOperator Address that handles bridge operations
     * @param _owner Owner of the contract
     */
    function initialize(
        address _bridgeOperator,
        address _owner
    ) external initializer {
        if (_bridgeOperator == address(0)) revert InvalidAddress();
        if (_owner == address(0)) revert InvalidAddress();
        
        bridgeOperator = _bridgeOperator;
        _transferOwnership(_owner);
        
        // Initialize UUPS upgradeable
        __UUPSUpgradeable_init();
    }

    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Mint wACG tokens (called by bridge operator when ACG is received)
     * @param to Address to receive wACG tokens
     * @param amount Amount of wACG to mint (in smallest unit - 8 decimals)
     */
    function mint(
        address to, 
        uint256 amount
    ) 
        external 
        onlyBridgeOperator
        whenNotPaused 
        nonReentrant 
        validAddress(to)
        validAmount(amount)
    {
        _mint(to, amount);
        totalACGWrapped += amount;
        
        emit ACGMinted(to, amount, block.timestamp);
    }

    /**
     * @dev Burn wACG tokens (called by bridge operator when unwrapping)
     * @param from Address to burn wACG tokens from
     * @param amount Amount of wACG to burn (in smallest unit - 8 decimals)
     */
    function burnFrom(
        address from, 
        uint256 amount
    ) 
        external 
        onlyBridgeOperator
        whenNotPaused 
        nonReentrant 
        validAddress(from)
        validAmount(amount)
    {
        if (balanceOf(from) < amount) revert InsufficientBalance();
        
        _burn(from, amount);
        totalACGUnwrapped += amount;
        
        emit ACGBurned(from, amount, block.timestamp);
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Change bridge operator (only owner)
     * @param newOperator New bridge operator address
     */
    function setBridgeOperator(
        address newOperator
    ) 
        external 
        onlyOwner 
        validAddress(newOperator)
    {
        address oldOperator = bridgeOperator;
        bridgeOperator = newOperator;
        
        emit BridgeOperatorChanged(oldOperator, newOperator);
    }

    /**
     * @dev Pause all operations (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause all operations (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ UUPS UPGRADEABLE ============
    
    /**
     * @dev Required by UUPSUpgradeable
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Get current implementation version
     */
    function getVersion() external pure returns (string memory) {
        return VERSION;
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get bridge statistics
     */
    function getBridgeStats() external view returns (
        uint256 _totalACGWrapped,
        uint256 _totalACGUnwrapped,
        uint256 _totalSupply
    ) {
        return (totalACGWrapped, totalACGUnwrapped, totalSupply());
    }
} 