// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
// Counters import removed

/**
 * @title WrappedACG
 * @dev Wrapped ACG token for cross-chain bridge functionality between ACG blockchain and Binance Smart Chain
 * 
 * SECURITY FEATURES:
 * - ReentrancyGuard: Prevents reentrancy attacks
 * - Pausable: Allows emergency pausing of operations
 * - Ownable: Restricted admin functions
 * - Request deduplication: Prevents duplicate wrap/unwrap requests
 * - Input validation: Comprehensive parameter validation
 * - Emergency recovery: Ability to recover stuck tokens
 * 
 * @author Aurum Crypto Gold Team
 * @notice This contract enables wrapping ACG tokens from ACG blockchain to wACG on BSC
 * @custom:security-contact security@aurumcryptogold.com
 */
contract WrappedACG is ERC20, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    // Counters.Counter private _requestIdCounter; // removed

    // ============ STATE VARIABLES ============
    
    /// @notice Custodian address that handles cross-chain operations
    address public custodian;
    
    /// @notice Total ACG tokens wrapped (in smallest unit - 8 decimals)
    uint256 public totalACGWrapped;
    
    /// @notice Total ACG tokens unwrapped (in smallest unit - 8 decimals)
    uint256 public totalACGUnwrapped;
    
    /// @notice Maximum amount that can be wrapped in a single transaction
    uint256 public maxWrapAmount;
    
    /// @notice Maximum amount that can be unwrapped in a single transaction
    uint256 public maxUnwrapAmount;
    
    /// @notice Minimum amount required for wrap/unwrap operations
    uint256 public minAmount;
    
    /// @notice Mapping to prevent duplicate wrap/unwrap requests
    mapping(bytes32 => bool) public processedRequests;
    
    // Counters.Counter private _requestIdCounter; // removed
    
    /// @notice Mapping to track daily wrap limits per address
    mapping(address => mapping(uint256 => uint256)) public dailyWrapAmounts;
    
    /// @notice Mapping to track daily unwrap limits per address
    mapping(address => mapping(uint256 => uint256)) public dailyUnwrapAmounts;
    
    /// @notice Daily limit for wrapping per address
    uint256 public dailyWrapLimit;
    
    /// @notice Daily limit for unwrapping per address
    uint256 public dailyUnwrapLimit;
    
    /// @notice Contract version
    string public constant VERSION = "1.0.1";

    /// @notice Emergency mint lock
    bool public mintLocked = false;

    // ============ EVENTS ============
    
    event CustodianChanged(address indexed oldCustodian, address indexed newCustodian);
    event ACGWrapped(address indexed to, uint256 amount, string acgTxHash, bytes32 indexed requestId, uint256 timestamp);
    event ACGUnwrapped(address indexed from, uint256 amount, string acgAddress, bytes32 indexed requestId, uint256 timestamp);
    event EmergencyRecovery(address indexed token, address indexed to, uint256 amount);
    event LimitsUpdated(uint256 maxWrapAmount, uint256 maxUnwrapAmount, uint256 minAmount);
    event DailyLimitsUpdated(uint256 dailyWrapLimit, uint256 dailyUnwrapLimit);
    event EmergencyMintingDisabled();

    // ============ ERRORS ============
    
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

    // ============ MODIFIERS ============
    
    /**
     * @dev Modifier to restrict function to custodian only
     */
    modifier onlyCustodian() {
        if (msg.sender != custodian) revert OnlyCustodian();
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

    /**
     * @dev Modifier to restrict emergency minting if locked
     */
    modifier mintNotLocked() {
        require(!mintLocked, "Emergency minting disabled");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor sets the initial custodian, owner, and limits
     * @param _custodian Address that handles cross-chain operations
     * @param _owner Owner of the contract (can change custodian and limits)
     * @param _maxWrapAmount Maximum amount that can be wrapped in a single transaction
     * @param _maxUnwrapAmount Maximum amount that can be unwrapped in a single transaction
     * @param _minAmount Minimum amount required for wrap/unwrap operations
     * @param _dailyWrapLimit Daily limit for wrapping per address
     * @param _dailyUnwrapLimit Daily limit for unwrapping per address
     */
    constructor(
        address _custodian,
        address _owner,
        uint256 _maxWrapAmount,
        uint256 _maxUnwrapAmount,
        uint256 _minAmount,
        uint256 _dailyWrapLimit,
        uint256 _dailyUnwrapLimit
    ) ERC20("Wrapped ACG", "wACG") {
        if (_custodian == address(0)) revert InvalidAddress();
        if (_owner == address(0)) revert InvalidAddress();
        if (_maxWrapAmount == 0) revert InvalidAmount();
        if (_maxUnwrapAmount == 0) revert InvalidAmount();
        if (_minAmount == 0) revert InvalidAmount();
        if (_dailyWrapLimit == 0) revert InvalidAmount();
        if (_dailyUnwrapLimit == 0) revert InvalidAmount();
        
        custodian = _custodian;
        maxWrapAmount = _maxWrapAmount;
        maxUnwrapAmount = _maxUnwrapAmount;
        minAmount = _minAmount;
        dailyWrapLimit = _dailyWrapLimit;
        dailyUnwrapLimit = _dailyUnwrapLimit;
        
        _transferOwnership(_owner);
    }

    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Wrap ACG tokens by minting wACG
     * Users call this function directly from their wallet
     * @param to Address to receive wACG tokens
     * @param amount Amount of ACG being wrapped (in smallest unit - 8 decimals)
     * @param acgTxHash Transaction hash from ACG blockchain
     */
    function wrap(
        address to, 
        uint256 amount, 
        string calldata acgTxHash
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        validAddress(to)
        validAmount(amount)
    {
        // Validate ACG transaction hash
        if (bytes(acgTxHash).length == 0) revert InvalidACGTxHash();
        
        // Check amount limits
        if (amount > maxWrapAmount) revert AmountExceedsMaxLimit();
        if (amount < minAmount) revert AmountBelowMinLimit();
        
        // Check daily limits
        uint256 today = block.timestamp / 1 days;
        uint256 newDailyAmount = dailyWrapAmounts[to][today] + amount;
        if (newDailyAmount > dailyWrapLimit) revert DailyLimitExceeded();
        
        // Create unique request ID to prevent duplicates
        bytes32 requestId = keccak256(abi.encodePacked(to, amount, acgTxHash, block.chainid));
        if (processedRequests[requestId]) revert RequestAlreadyProcessed();
        
        // Update state
        processedRequests[requestId] = true;
        totalACGWrapped += amount;
        dailyWrapAmounts[to][today] = newDailyAmount;
        
        // Mint wACG tokens
        _mint(to, amount);
        
        emit ACGWrapped(to, amount, acgTxHash, requestId, block.timestamp);
    }

    /**
     * @dev Unwrap wACG tokens by burning them
     * Users call this function directly from their wallet
     * @param from Address to burn wACG tokens from (must be msg.sender)
     * @param amount Amount of wACG to unwrap
     * @param acgAddress ACG address to send unwrapped tokens to
     */
    function unwrap(
        address from, 
        uint256 amount, 
        string calldata acgAddress
    ) 
        external 
        whenNotPaused 
        nonReentrant 
        validAddress(from)
        validAmount(amount)
    {
        // Validate sender
        if (from != msg.sender) revert InvalidAddress();
        
        // Validate ACG address
        if (bytes(acgAddress).length == 0) revert InvalidACGAddress();
        
        // Check balance
        if (balanceOf(from) < amount) revert InsufficientBalance();
        
        // Check amount limits
        if (amount > maxUnwrapAmount) revert AmountExceedsMaxLimit();
        if (amount < minAmount) revert AmountBelowMinLimit();
        
        // Check daily limits
        uint256 today = block.timestamp / 1 days;
        uint256 newDailyAmount = dailyUnwrapAmounts[from][today] + amount;
        if (newDailyAmount > dailyUnwrapLimit) revert DailyLimitExceeded();
        
        // Create unique request ID to prevent duplicates
        bytes32 requestId = keccak256(abi.encodePacked(from, amount, acgAddress, block.chainid));
        if (processedRequests[requestId]) revert RequestAlreadyProcessed();
        
        // Update state
        processedRequests[requestId] = true;
        totalACGUnwrapped += amount;
        dailyUnwrapAmounts[from][today] = newDailyAmount;
        
        // Burn wACG tokens
        _burn(from, amount);
        
        emit ACGUnwrapped(from, amount, acgAddress, requestId, block.timestamp);
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Emergency mint function for custodian (in case of issues)
     * @param to Address to receive wACG tokens
     * @param amount Amount to mint
     */
    function emergencyMint(
        address to, 
        uint256 amount
    ) 
        external 
        onlyCustodian 
        whenNotPaused 
        validAddress(to)
        validAmount(amount)
        mintNotLocked
    {
        _mint(to, amount);
    }

    /**
     * @dev Disable emergency minting forever (owner only)
     */
    function disableEmergencyMinting() external onlyOwner {
        mintLocked = true;
        emit EmergencyMintingDisabled();
    }

    /**
     * @dev Change the custodian address (owner only)
     * @param newCustodian New custodian address
     */
    function changeCustodian(address newCustodian) 
        external 
        onlyOwner 
        validAddress(newCustodian)
    {
        if (newCustodian == custodian) revert InvalidAddress();
        
        address oldCustodian = custodian;
        custodian = newCustodian;
        
        emit CustodianChanged(oldCustodian, newCustodian);
    }

    /**
     * @dev Update transaction limits (owner only)
     * @param _maxWrapAmount New maximum wrap amount
     * @param _maxUnwrapAmount New maximum unwrap amount
     * @param _minAmount New minimum amount
     */
    function updateLimits(
        uint256 _maxWrapAmount,
        uint256 _maxUnwrapAmount,
        uint256 _minAmount
    ) external onlyOwner {
        if (_maxWrapAmount == 0) revert InvalidAmount();
        if (_maxUnwrapAmount == 0) revert InvalidAmount();
        if (_minAmount == 0) revert InvalidAmount();
        
        maxWrapAmount = _maxWrapAmount;
        maxUnwrapAmount = _maxUnwrapAmount;
        minAmount = _minAmount;
        
        emit LimitsUpdated(_maxWrapAmount, _maxUnwrapAmount, _minAmount);
    }

    /**
     * @dev Update daily limits (owner only)
     * @param _dailyWrapLimit New daily wrap limit
     * @param _dailyUnwrapLimit New daily unwrap limit
     */
    function updateDailyLimits(
        uint256 _dailyWrapLimit,
        uint256 _dailyUnwrapLimit
    ) external onlyOwner {
        if (_dailyWrapLimit == 0) revert InvalidAmount();
        if (_dailyUnwrapLimit == 0) revert InvalidAmount();
        
        dailyWrapLimit = _dailyWrapLimit;
        dailyUnwrapLimit = _dailyUnwrapLimit;
        
        emit DailyLimitsUpdated(_dailyWrapLimit, _dailyUnwrapLimit);
    }

    /**
     * @dev Pause the contract (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency function to recover stuck ERC20 tokens (owner only)
     * @param token Address of the token to recover
     * @param to Address to send tokens to
     * @param amount Amount to recover
     */
    function emergencyRecoverERC20(
        address token, 
        address to, 
        uint256 amount
    ) 
        external 
        onlyOwner 
        validAddress(token)
        validAddress(to)
        validAmount(amount)
    {
        if (token == address(this)) revert InvalidAddress();
        
        IERC20(token).safeTransfer(to, amount);
        
        emit EmergencyRecovery(token, to, amount);
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get contract statistics
     * @return _totalSupply Current wACG supply
     * @return _totalACGWrapped Total ACG wrapped
     * @return _totalACGUnwrapped Total ACG unwrapped
     * @return _custodian Current custodian address
     * @return _paused Whether contract is paused
     * @return _maxWrapAmount Maximum wrap amount
     * @return _maxUnwrapAmount Maximum unwrap amount
     * @return _minAmount Minimum amount
     * @return _dailyWrapLimit Daily wrap limit
     * @return _dailyUnwrapLimit Daily unwrap limit
     */
    function getStats() external view returns (
        uint256 _totalSupply,
        uint256 _totalACGWrapped,
        uint256 _totalACGUnwrapped,
        address _custodian,
        bool _paused,
        uint256 _maxWrapAmount,
        uint256 _maxUnwrapAmount,
        uint256 _minAmount,
        uint256 _dailyWrapLimit,
        uint256 _dailyUnwrapLimit
    ) {
        return (
            totalSupply(),
            totalACGWrapped,
            totalACGUnwrapped,
            custodian,
            paused(),
            maxWrapAmount,
            maxUnwrapAmount,
            minAmount,
            dailyWrapLimit,
            dailyUnwrapLimit
        );
    }

    /**
     * @dev Get daily wrap amount for a specific address and date
     * @param user Address to check
     * @param date Date in days since epoch
     * @return Amount wrapped on that date
     */
    function getDailyWrapAmount(address user, uint256 date) external view returns (uint256) {
        return dailyWrapAmounts[user][date];
    }

    /**
     * @dev Get daily unwrap amount for a specific address and date
     * @param user Address to check
     * @param date Date in days since epoch
     * @return Amount unwrapped on that date
     */
    function getDailyUnwrapAmount(address user, uint256 date) external view returns (uint256) {
        return dailyUnwrapAmounts[user][date];
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
     * @dev Override decimals to match ACG (8 decimals)
     */
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }

    // ============ OVERRIDE FUNCTIONS ============
    
    /**
     * @dev Override transfer to check for paused state
     */
    function transfer(address to, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom to check for paused state
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Override approve to check for paused state
     */
    function approve(address spender, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.approve(spender, amount);
    }

    /**
     * @dev Override increaseAllowance to check for paused state
     */
    function increaseAllowance(address spender, uint256 addedValue) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.increaseAllowance(spender, addedValue);
    }

    /**
     * @dev Override decreaseAllowance to check for paused state
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.decreaseAllowance(spender, subtractedValue);
    }
} 