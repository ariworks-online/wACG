// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title WrappedACG (Upgradeable)
 * @dev Simplified wACG token for ACG Bridge - Only essential mint/burn functions
 * Upgrade-safe: uses OpenZeppelin Upgradeable contracts and initializer pattern
 */
contract WrappedACG is Initializable, ERC20Upgradeable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    // ============ STATE VARIABLES ============
    address public bridgeOperator;
    uint256 public totalACGWrapped;
    uint256 public totalACGUnwrapped;
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
    modifier onlyBridgeOperator() {
        if (msg.sender != bridgeOperator) revert OnlyBridgeOperator();
        _;
    }
    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }
    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    // ============ INITIALIZER ============
    function initialize(address _bridgeOperator, address _owner) public initializer {
        __ERC20_init("Wrapped ACG", "wACG");
        __Ownable_init(_owner);
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        if (_bridgeOperator == address(0)) revert InvalidAddress();
        if (_owner == address(0)) revert InvalidAddress();
        bridgeOperator = _bridgeOperator;
        _transferOwnership(_owner);
    }

    // ============ CORE FUNCTIONS ============
    function mint(address to, uint256 amount)
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

    function burnFrom(address from, uint256 amount)
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
    function setBridgeOperator(address newOperator)
        external
        onlyOwner
        validAddress(newOperator)
    {
        address oldOperator = bridgeOperator;
        bridgeOperator = newOperator;
        emit BridgeOperatorChanged(oldOperator, newOperator);
    }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
    function getVersion() external pure returns (string memory) { return VERSION; }
    function getBridgeStats() external view returns (uint256, uint256, uint256) {
        return (totalACGWrapped, totalACGUnwrapped, totalSupply());
    }
    function decimals() public view virtual override returns (uint8) { return 8; }
} 