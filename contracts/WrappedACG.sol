// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title WrappedACG (Upgradeable) - Enhanced Security Version
 * @dev Wrapped ACG token for cross-chain bridge functionality between ACG blockchain and BSC
 * 
 * SECURITY FEATURES:
 * - ReentrancyGuard: Prevents reentrancy attacks
 * - Pausable: Allows emergency pausing of operations
 * - Ownable: Restricted admin functions
 * - Replay Protection: Prevents duplicate mint/burn requests
 * - Enhanced Events: Comprehensive monitoring and alerting
 * - Emergency Recovery: Ability to recover stuck transactions
 * - Multi-Sig Ready: Compatible with Gnosis Safe and other multi-sig wallets
 * 
 * @author Aurum Crypto Gold Team
 * @notice This contract enables wrapping ACG tokens from ACG blockchain to wACG on BSC
 * @custom:security-contact security@aurumcryptogold.com
 * 
 * AUDIT STATUS: Enhanced based on security audit recommendations
 * VERSION: 1.1.0
 */
contract WrappedACG is Initializable, ERC20Upgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    
    // ============ STATE VARIABLES ============
    
    /// @notice Bridge operator address that can mint and burn tokens
    address public bridgeOperator;
    
    /// @notice Total ACG tokens wrapped (in smallest unit - 8 decimals)
    uint256 public totalACGWrapped;
    
    /// @notice Total ACG tokens unwrapped (in smallest unit - 8 decimals)
    uint256 public totalACGUnwrapped;
    
    /// @notice Contract version
    string public constant VERSION = "1.1.0";
    
    /// @notice Mapping to prevent replay attacks - tracks processed request IDs
    mapping(bytes32 => bool) public processedRequests;
    
    /// @notice Emergency recovery address (multi-sig wallet)
    address public emergencyRecovery;
    
    /// @notice Maximum supply cap (0 = unlimited)
    uint256 public maxSupply;
    
    /// @notice Daily mint limit per address
    mapping(address => mapping(uint256 => uint256)) public dailyMintAmounts;
    
    /// @notice Daily burn limit per address
    mapping(address => mapping(uint256 => uint256)) public dailyBurnAmounts;
    
    /// @notice Daily mint limit (0 = unlimited)
    uint256 public dailyMintLimit;
    
    /// @notice Daily burn limit (0 = unlimited)
    uint256 public dailyBurnLimit;

    // ============ EVENTS ============
    
    event BridgeOperatorChanged(address indexed oldOperator, address indexed newOperator);
    event ACGMinted(
        address indexed to, 
        uint256 amount, 
        uint256 timestamp, 
        bytes32 indexed requestId,
        string acgTxHash
    );
    event ACGBurned(
        address indexed from, 
        uint256 amount, 
        uint256 timestamp, 
        bytes32 indexed requestId,
        string acgTargetAddress
    );
    event EmergencyRecoverySet(address indexed oldRecovery, address indexed newRecovery);
    event EmergencyRecoveryExecuted(
        address indexed token, 
        address indexed to, 
        uint256 amount, 
        string reason
    );
    event LimitsUpdated(
        uint256 maxSupply, 
        uint256 dailyMintLimit, 
        uint256 dailyBurnLimit
    );
    event RequestProcessed(bytes32 indexed requestId, bool success, string reason);
    event BridgeStatsUpdated(
        uint256 totalWrapped, 
        uint256 totalUnwrapped, 
        uint256 currentSupply
    );

    // ============ ERRORS ============
    
    error InvalidAddress();
    error InvalidAmount();
    error OnlyBridgeOperator();
    error InsufficientBalance();
    error RequestAlreadyProcessed();
    error MaxSupplyExceeded();
    error DailyLimitExceeded();
    error OnlyEmergencyRecovery();
    error InvalidRequestId();
    error EmergencyRecoveryNotSet();

    // ============ MODIFIERS ============
    
    /**
     * @dev Modifier to restrict function to bridge operator only
     */
    modifier onlyBridgeOperator() {
        if (msg.sender != bridgeOperator) revert OnlyBridgeOperator();
        _;
    }
    
    /**
     * @dev Modifier to restrict function to emergency recovery only
     */
    modifier onlyEmergencyRecovery() {
        if (msg.sender != emergencyRecovery) revert OnlyEmergencyRecovery();
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

    // ============ INITIALIZER ============
    
    /**
     * @dev Initialize function for proxy deployment
     * @param _bridgeOperator Address that handles bridge operations
     * @param _owner Owner of the contract
     * @param _emergencyRecovery Emergency recovery address (multi-sig)
     * @param _maxSupply Maximum supply cap (0 = unlimited)
     * @param _dailyMintLimit Daily mint limit per address (0 = unlimited)
     * @param _dailyBurnLimit Daily burn limit per address (0 = unlimited)
     */
    function initialize(
        address _bridgeOperator, 
        address _owner,
        address _emergencyRecovery,
        uint256 _maxSupply,
        uint256 _dailyMintLimit,
        uint256 _dailyBurnLimit
    ) public initializer {
        __ERC20_init("Wrapped ACG", "wACG");
        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        if (_bridgeOperator == address(0)) revert InvalidAddress();
        if (_owner == address(0)) revert InvalidAddress();
        
        bridgeOperator = _bridgeOperator;
        emergencyRecovery = _emergencyRecovery;
        maxSupply = _maxSupply;
        dailyMintLimit = _dailyMintLimit;
        dailyBurnLimit = _dailyBurnLimit;
        
        _transferOwnership(_owner);
    }

    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Mint wACG tokens (called by bridge operator when ACG is received)
     * @param to Address to receive wACG tokens
     * @param amount Amount of wACG to mint (in smallest unit - 8 decimals)
     * @param requestId Unique request identifier to prevent replay attacks
     * @param acgTxHash ACG transaction hash for verification
     */
    function mint(
        address to, 
        uint256 amount,
        bytes32 requestId,
        string calldata acgTxHash
    ) 
        external 
        onlyBridgeOperator
        whenNotPaused 
        nonReentrant 
        validAddress(to)
        validAmount(amount)
    {
        // Validate request ID
        if (requestId == bytes32(0)) revert InvalidRequestId();
        
        // Check for replay attacks
        if (processedRequests[requestId]) revert RequestAlreadyProcessed();
        
        // Check supply cap
        if (maxSupply > 0 && totalSupply() + amount > maxSupply) {
            revert MaxSupplyExceeded();
        }
        
        // Check daily limits
        if (dailyMintLimit > 0) {
            uint256 today = block.timestamp / 1 days;
            uint256 dailyAmount = dailyMintAmounts[to][today] + amount;
            if (dailyAmount > dailyMintLimit) revert DailyLimitExceeded();
            dailyMintAmounts[to][today] = dailyAmount;
        }
        
        // Mark request as processed
        processedRequests[requestId] = true;
        
        // Mint tokens
        _mint(to, amount);
        totalACGWrapped += amount;
        
        emit ACGMinted(to, amount, block.timestamp, requestId, acgTxHash);
        emit RequestProcessed(requestId, true, "Mint successful");
        emit BridgeStatsUpdated(totalACGWrapped, totalACGUnwrapped, totalSupply());
    }

    /**
     * @dev Burn wACG tokens (called by bridge operator when unwrapping)
     * @param from Address to burn wACG tokens from
     * @param amount Amount of wACG to burn (in smallest unit - 8 decimals)
     * @param requestId Unique request identifier to prevent replay attacks
     * @param acgTargetAddress ACG address to send unwrapped tokens to
     */
    function burnFrom(
        address from, 
        uint256 amount,
        bytes32 requestId,
        string calldata acgTargetAddress
    ) 
        external 
        onlyBridgeOperator
        whenNotPaused 
        nonReentrant 
        validAddress(from)
        validAmount(amount)
    {
        // Validate request ID
        if (requestId == bytes32(0)) revert InvalidRequestId();
        
        // Check for replay attacks
        if (processedRequests[requestId]) revert RequestAlreadyProcessed();
        
        // Check balance
        if (balanceOf(from) < amount) revert InsufficientBalance();
        
        // Check daily limits
        if (dailyBurnLimit > 0) {
            uint256 today = block.timestamp / 1 days;
            uint256 dailyAmount = dailyBurnAmounts[from][today] + amount;
            if (dailyAmount > dailyBurnLimit) revert DailyLimitExceeded();
            dailyBurnAmounts[from][today] = dailyAmount;
        }
        
        // Mark request as processed
        processedRequests[requestId] = true;
        
        // Burn tokens
        _burn(from, amount);
        totalACGUnwrapped += amount;
        
        emit ACGBurned(from, amount, block.timestamp, requestId, acgTargetAddress);
        emit RequestProcessed(requestId, true, "Burn successful");
        emit BridgeStatsUpdated(totalACGWrapped, totalACGUnwrapped, totalSupply());
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
     * @dev Set emergency recovery address (only owner)
     * @param newRecovery New emergency recovery address
     */
    function setEmergencyRecovery(
        address newRecovery
    ) 
        external 
        onlyOwner 
        validAddress(newRecovery)
    {
        address oldRecovery = emergencyRecovery;
        emergencyRecovery = newRecovery;
        
        emit EmergencyRecoverySet(oldRecovery, newRecovery);
    }
    
    /**
     * @dev Update contract limits (only owner)
     * @param _maxSupply New maximum supply cap
     * @param _dailyMintLimit New daily mint limit
     * @param _dailyBurnLimit New daily burn limit
     */
    function updateLimits(
        uint256 _maxSupply,
        uint256 _dailyMintLimit,
        uint256 _dailyBurnLimit
    ) external onlyOwner {
        maxSupply = _maxSupply;
        dailyMintLimit = _dailyMintLimit;
        dailyBurnLimit = _dailyBurnLimit;
        
        emit LimitsUpdated(_maxSupply, _dailyMintLimit, _dailyBurnLimit);
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

    // ============ EMERGENCY FUNCTIONS ============
    
    /**
     * @dev Emergency function to recover stuck ERC20 tokens (emergency recovery only)
     * @param token Address of the token to recover
     * @param to Address to send tokens to
     * @param amount Amount to recover
     * @param reason Reason for recovery
     */
    function emergencyRecoverERC20(
        address token, 
        address to, 
        uint256 amount,
        string calldata reason
    ) 
        external 
        onlyEmergencyRecovery 
        validAddress(token)
        validAddress(to)
        validAmount(amount)
    {
        // Prevent recovery of wACG tokens unless contract is paused
        if (token == address(this) && !paused()) {
            revert("Cannot recover wACG tokens while contract is active");
        }
        
        // Transfer tokens
        IERC20(token).transfer(to, amount);
        
        emit EmergencyRecoveryExecuted(token, to, amount, reason);
    }
    
    /**
     * @dev Emergency function to force process a stuck request (emergency recovery only)
     * @param requestId Request ID to force process
     * @param reason Reason for force processing
     */
    function emergencyForceProcess(
        bytes32 requestId,
        string calldata reason
    ) external onlyEmergencyRecovery {
        if (requestId == bytes32(0)) revert InvalidRequestId();
        
        processedRequests[requestId] = true;
        
        emit RequestProcessed(requestId, true, reason);
    }

    // ============ UUPS UPGRADEABLE ============
    
    /**
     * @dev Required by UUPSUpgradeable
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get current implementation version
     */
    function getVersion() external pure returns (string memory) {
        return VERSION;
    }
    
    /**
     * @dev Get bridge statistics
     */
    function getBridgeStats() external view returns (
        uint256 _totalACGWrapped,
        uint256 _totalACGUnwrapped,
        uint256 _totalSupply,
        uint256 _maxSupply,
        uint256 _dailyMintLimit,
        uint256 _dailyBurnLimit
    ) {
        return (
            totalACGWrapped, 
            totalACGUnwrapped, 
            totalSupply(),
            maxSupply,
            dailyMintLimit,
            dailyBurnLimit
        );
    }
    
    /**
     * @dev Check if a request has been processed
     * @param requestId Request ID to check
     * @return Whether the request has been processed
     */
    function isRequestProcessed(bytes32 requestId) external view returns (bool) {
        return processedRequests[requestId];
    }
    
    /**
     * @dev Get daily mint amount for a specific address and date
     * @param user Address to check
     * @param date Date in days since epoch
     * @return Amount minted on that date
     */
    function getDailyMintAmount(address user, uint256 date) external view returns (uint256) {
        return dailyMintAmounts[user][date];
    }
    
    /**
     * @dev Get daily burn amount for a specific address and date
     * @param user Address to check
     * @param date Date in days since epoch
     * @return Amount burned on that date
     */
    function getDailyBurnAmount(address user, uint256 date) external view returns (uint256) {
        return dailyBurnAmounts[user][date];
    }
    
    /**
     * @dev Override decimals to match ACG (8 decimal places)
     */
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }
} 