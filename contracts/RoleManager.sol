// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract RoleManager is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // Role definitions
    bytes32 public constant FAN_ROLE = keccak256("FAN_ROLE");
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    bytes32 public constant ARTIST_ROLE = keccak256("ARTIST_ROLE");
    bytes32 public constant BRAND_ROLE = keccak256("BRAND_ROLE");
    bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");
    bytes32 public constant FAN_ASSIGNER_ROLE = keccak256("FAN_ASSIGNER_ROLE");

    // Events
    event RoleAssigned(address indexed user, bytes32 indexed role);
    event RoleRevoked(address indexed user, bytes32 indexed role);
    event FanAssignerAuthorized(address indexed assigner);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract replacing the constructor
     */
    function initialize() public initializer {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        // Grant the contract deployer the default admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev Assigns a role to a user. Can only be called by an account with DEFAULT_ADMIN_ROLE.
     * @param user The address of the user to assign the role to
     * @param role The role to assign
     */
    function assignRole(address user, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(role, user);
        emit RoleAssigned(user, role);
    }

    /**
     * @dev Removes a role from a user. Can only be called by an account with DEFAULT_ADMIN_ROLE.
     * @param user The address of the user to remove the role from
     * @param role The role to remove
     */
    function removeRole(address user, bytes32 role) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(role, user);
        emit RoleRevoked(user, role);
    }

    /**
     * @dev Authorizes a contract to assign the FAN_ROLE. Can only be called by an account with DEFAULT_ADMIN_ROLE.
     * @param assigner The address of the contract to authorize
     */
    function authorizeFanAssigner(address assigner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(FAN_ASSIGNER_ROLE, assigner);
        emit FanAssignerAuthorized(assigner);
    }

    /**
     * @dev Assigns the FAN_ROLE to a user. Can only be called by authorized contracts or admin.
     * @param user The address of the user to assign the FAN_ROLE to
     */
    function assignFanRole(address user) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || 
                hasRole(FAN_ASSIGNER_ROLE, msg.sender), "Caller is not authorized");
        _grantRole(FAN_ROLE, user);
        emit RoleAssigned(user, FAN_ROLE);
    }

    /**
     * @dev Checks if a user has any of the specified roles
     * @param user The address of the user to check
     * @param roles Array of roles to check
     * @return bool True if the user has any of the roles
     */
    function hasAnyRole(address user, bytes32[] calldata roles) external view returns (bool) {
        for (uint i = 0; i < roles.length; i++) {
            if (hasRole(roles[i], user)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Checks if a user has all of the specified roles
     * @param user The address of the user to check
     * @param roles Array of roles to check
     * @return bool True if the user has all of the roles
     */
    function hasAllRoles(address user, bytes32[] calldata roles) external view returns (bool) {
        for (uint i = 0; i < roles.length; i++) {
            if (!hasRole(roles[i], user)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Gets all roles assigned to a user
     * @param user The address of the user to check
     * @return roles Array of roles assigned to the user
     */
    function getUserRoles(address user) external view returns (bytes32[] memory) {
        bytes32[] memory allRoles = new bytes32[](5);
        allRoles[0] = FAN_ROLE;
        allRoles[1] = ORGANIZER_ROLE;
        allRoles[2] = ARTIST_ROLE;
        allRoles[3] = BRAND_ROLE;
        allRoles[4] = MODERATOR_ROLE;

        uint8 count = 0;
        for (uint i = 0; i < allRoles.length; i++) {
            if (hasRole(allRoles[i], user)) {
                count++;
            }
        }

        bytes32[] memory userRoles = new bytes32[](count);
        uint8 index = 0;
        for (uint i = 0; i < allRoles.length; i++) {
            if (hasRole(allRoles[i], user)) {
                userRoles[index] = allRoles[i];
                index++;
            }
        }

        return userRoles;
    }
} 