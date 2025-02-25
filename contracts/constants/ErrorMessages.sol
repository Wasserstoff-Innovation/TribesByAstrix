// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Errors.sol";

library ErrorMessages {
    function getMessage(uint16 code) internal pure returns (string memory) {
        // Common errors (1-99)
        if (code == Errors.UNAUTHORIZED) return "Unauthorized";
        if (code == Errors.INVALID_PARAMETER) return "Invalid parameter";
        if (code == Errors.ZERO_ADDRESS) return "Zero address not allowed";
        if (code == Errors.ALREADY_EXISTS) return "Already exists";
        if (code == Errors.DOES_NOT_EXIST) return "Does not exist";
        
        // Tribe errors (100-199)
        if (code == Errors.NOT_TRIBE_MEMBER) return "Not a tribe member";
        if (code == Errors.ALREADY_MEMBER) return "Already a member";
        if (code == Errors.USER_BANNED) return "User is banned";
        if (code == Errors.INVALID_JOIN_TYPE) return "Invalid join type";
        if (code == Errors.INSUFFICIENT_ENTRY_FEE) return "Insufficient entry fee";
        if (code == Errors.INVALID_INVITE_CODE) return "Invalid invite code";
        if (code == Errors.INVITE_CODE_EXPIRED) return "Invite code expired";
        if (code == Errors.INVITE_CODE_USED) return "Invite code fully used";
        
        // Post errors (200-299)
        if (code == Errors.EMPTY_METADATA) return "Empty metadata";
        if (code == Errors.INVALID_METADATA) return "Invalid metadata format";
        if (code == Errors.POST_NOT_FOUND) return "Post not found";
        if (code == Errors.POST_DELETED) return "Post deleted";
        if (code == Errors.ALREADY_INTERACTED) return "Already interacted";
        if (code == Errors.CANNOT_INTERACT_OWN) return "Cannot interact with own post";
        if (code == Errors.COOLDOWN_ACTIVE) return "Cooldown active";
        
        // Collectible errors (300-399)
        if (code == Errors.SUPPLY_LIMIT_REACHED) return "Supply limit reached";
        if (code == Errors.COLLECTIBLE_INACTIVE) return "Collectible not active";
        if (code == Errors.INSUFFICIENT_POINTS) return "Insufficient points";
        if (code == Errors.INSUFFICIENT_PAYMENT) return "Insufficient payment";
        if (code == Errors.INVALID_COLLECTIBLE_CONTRACT) return "Invalid collectible contract";
        if (code == Errors.INVALID_COLLECTIBLE) return "Invalid collectible";
        
        return "Unknown error";
    }
} 