// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./AstrixToken.sol";

/**
 * @title TokenDispenser
 * @notice Contract for managing organization deposits of Astrix tokens
 * @dev Organizations deposit Astrix tokens and authorize the platform to spend them
 */
contract TokenDispenser is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using ECDSAUpgradeable for bytes32;

    // Roles
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");
    bytes32 public constant SPENDER_ROLE = keccak256("SPENDER_ROLE");

    // Reference to the Astrix token
    AstrixToken public astrixToken;

    // Organization => Admin
    mapping(address => address) public organizationAdmins;
    
    // Organization => Balance
    mapping(address => uint256) public deposits;
    
    // Used signatures to prevent replay attacks
    mapping(bytes => bool) public usedSignatures;

    /**
     * @dev Emitted when an organization deposits tokens
     */
    event TokensDeposited(address indexed organization, uint256 amount);
    
    /**
     * @dev Emitted when tokens are spent on behalf of an organization
     */
    event TokensSpent(address indexed organization, address indexed recipient, uint256 amount, string reason);
    
    /**
     * @dev Emitted when an organization withdraws tokens
     */
    event TokensWithdrawn(address indexed organization, uint256 amount);
    
    /**
     * @dev Emitted when an organization admin is updated
     */
    event OrganizationAdminUpdated(address indexed organization, address indexed oldAdmin, address indexed newAdmin);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract replacing the constructor
     * @param _astrixToken Address of the Astrix token contract
     * @param _admin Address to receive the admin role
     */
    function initialize(address _astrixToken, address _admin) public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        astrixToken = AstrixToken(_astrixToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PLATFORM_ROLE, _admin);
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @notice Allows an organization to deposit Astrix tokens
     * @param amount Amount of tokens to deposit
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        // Set organization admin if not already set
        if (organizationAdmins[msg.sender] == address(0)) {
            organizationAdmins[msg.sender] = msg.sender;
            emit OrganizationAdminUpdated(msg.sender, address(0), msg.sender);
        }
        
        // Transfer tokens from sender to this contract
        IERC20Upgradeable(address(astrixToken)).safeTransferFrom(msg.sender, address(this), amount);
        
        // Update deposit balance
        deposits[msg.sender] += amount;
        
        emit TokensDeposited(msg.sender, amount);
    }

    /**
     * @notice Allows an organization admin to withdraw tokens
     * @param amount Amount of tokens to withdraw
     */
    function withdraw(uint256 amount) external {
        address organization = msg.sender;
        require(organizationAdmins[organization] == msg.sender, "Not organization admin");
        require(deposits[organization] >= amount, "Insufficient balance");
        
        // Update deposit balance
        deposits[organization] -= amount;
        
        // Transfer tokens to organization
        IERC20Upgradeable(address(astrixToken)).safeTransfer(organization, amount);
        
        emit TokensWithdrawn(organization, amount);
    }

    /**
     * @notice Allows an organization to update their admin
     * @param newAdmin New admin address
     */
    function updateOrganizationAdmin(address newAdmin) external {
        require(newAdmin != address(0), "Invalid admin address");
        address oldAdmin = organizationAdmins[msg.sender];
        require(oldAdmin == msg.sender, "Not current admin");
        
        organizationAdmins[msg.sender] = newAdmin;
        
        emit OrganizationAdminUpdated(msg.sender, oldAdmin, newAdmin);
    }

    /**
     * @notice Spends tokens on behalf of an organization with admin permission
     * @param organization Organization address
     * @param recipient Recipient of the tokens
     * @param amount Amount of tokens to spend
     * @param reason Reason for spending
     * @param signature Signature from the organization admin
     */
    function spendWithSignature(
        address organization,
        address recipient,
        uint256 amount,
        string calldata reason,
        bytes calldata signature
    ) external onlyRole(SPENDER_ROLE) {
        require(deposits[organization] >= amount, "Insufficient organization balance");
        require(!usedSignatures[signature], "Signature already used");
        
        // Create message hash
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                organization,
                recipient,
                amount,
                reason
            )
        );
        bytes32 ethSignedMessageHash = ECDSAUpgradeable.toEthSignedMessageHash(messageHash);
        
        // Verify signature
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == organizationAdmins[organization], "Invalid signature");
        
        // Mark signature as used
        usedSignatures[signature] = true;
        
        // Update deposit balance
        deposits[organization] -= amount;
        
        // Transfer tokens to recipient
        IERC20Upgradeable(address(astrixToken)).safeTransfer(recipient, amount);
        
        emit TokensSpent(organization, recipient, amount, reason);
    }

    /**
     * @notice For platform to spend tokens from an organization (for automated processes)
     * @param organization Organization address
     * @param recipient Recipient of the tokens
     * @param amount Amount of tokens to spend
     * @param reason Reason for spending
     */
    function platformSpend(
        address organization,
        address recipient,
        uint256 amount,
        string calldata reason
    ) external onlyRole(PLATFORM_ROLE) {
        require(deposits[organization] >= amount, "Insufficient organization balance");
        
        // Update deposit balance
        deposits[organization] -= amount;
        
        // Transfer tokens to recipient
        IERC20Upgradeable(address(astrixToken)).safeTransfer(recipient, amount);
        
        emit TokensSpent(organization, recipient, amount, reason);
    }

    /**
     * @notice Grant the spender role to an address
     * @param spender Address to grant the role to
     */
    function grantSpenderRole(address spender) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SPENDER_ROLE, spender);
    }

    /**
     * @notice Revoke the spender role from an address
     * @param spender Address to revoke the role from
     */
    function revokeSpenderRole(address spender) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(SPENDER_ROLE, spender);
    }

    /**
     * @notice Get an organization's token balance
     * @param organization Organization address
     * @return uint256 Token balance
     */
    function getBalance(address organization) external view returns (uint256) {
        return deposits[organization];
    }
} 