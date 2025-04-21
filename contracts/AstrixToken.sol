// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title AstrixToken
 * @notice ERC20 token for the Astrix ecosystem
 * @dev This token is used as the basis for the points system in Tribes by Astrix
 */
contract AstrixToken is Initializable, ERC20Upgradeable, ERC20BurnableUpgradeable, AccessControlUpgradeable, ERC20PermitUpgradeable, UUPSUpgradeable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Initializes the contract replacing the constructor
     * @param initialSupply Initial supply of tokens to mint to the deployer
     * @param admin Address that will receive the default admin role
     */
    function initialize(uint256 initialSupply, address admin) public initializer {
        __ERC20_init("Astrix Token", "ASTRX");
        __ERC20Burnable_init();
        __AccessControl_init();
        __ERC20Permit_init("Astrix Token");
        __UUPSUpgradeable_init();
        
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds max supply");
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);
        
        _mint(admin, initialSupply);
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @notice Mints new tokens
     * @param to Address to receive the tokens
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Mint would exceed max supply");
        _mint(to, amount);
    }

    /**
     * @notice Burns tokens with role-based access control
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) public override onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    /**
     * @notice Override to enforce role check on burning
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public override(ERC20BurnableUpgradeable) onlyRole(BURNER_ROLE) {
        super.burn(amount);
    }

    /**
     * @notice Function to check if an address has the minter role
     * @param account Address to check
     * @return bool True if the address has the minter role
     */
    function isMinter(address account) external view returns (bool) {
        return hasRole(MINTER_ROLE, account);
    }

    /**
     * @notice Function to check if an address has the burner role
     * @param account Address to check
     * @return bool True if the address has the burner role
     */
    function isBurner(address account) external view returns (bool) {
        return hasRole(BURNER_ROLE, account);
    }

    /**
     * @notice Gets the current percentage of tokens that have been minted relative to max supply
     * @return uint256 Percentage of max supply minted (0-100)
     */
    function percentMinted() external view returns (uint256) {
        return (totalSupply() * 100) / MAX_SUPPLY;
    }

    /**
     * @notice Gets the remaining tokens that can be minted
     * @return uint256 Number of tokens that can still be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
} 