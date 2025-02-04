// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./RoleManager.sol";

contract CommunityPoints {
    using MessageHashUtils for bytes32;
    using ECDSA for bytes32;

    RoleManager public roleManager;
    address public verifier;
    
    // Mapping to track used signatures to prevent replay attacks
    mapping(bytes => bool) public usedSignatures;
    
    event PointsRedeemed(address indexed user, uint256 points, uint256 collectibleType);
    
    constructor(address _roleManager, address _verifier) {
        roleManager = RoleManager(_roleManager);
        verifier = _verifier;
    }
    
    /**
     * @dev Verifies and processes point redemption for collectibles
     * @param points Number of points being redeemed
     * @param collectibleType Type of collectible to redeem
     * @param signature Backend signature verifying point balance
     */
    function redeemPoints(
        uint256 points,
        uint256 collectibleType,
        bytes calldata signature
    ) external {
        require(!usedSignatures[signature], "Signature already used");
        
        // Create message hash
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, points, collectibleType)
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        // Verify signature
        address signer = ethSignedMessageHash.recover(signature);
        require(signer == verifier, "Invalid signature");
        
        // Mark signature as used
        usedSignatures[signature] = true;
        
        // Emit event for off-chain tracking
        emit PointsRedeemed(msg.sender, points, collectibleType);
    }
    
    /**
     * @dev Updates the verifier address (for backend signature verification)
     * @param newVerifier New verifier address
     */
    function setVerifier(address newVerifier) external {
        require(
            roleManager.hasRole(roleManager.DEFAULT_ADMIN_ROLE(), msg.sender),
            "Not admin"
        );
        verifier = newVerifier;
    }
} 