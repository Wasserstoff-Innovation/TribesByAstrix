// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library Errors {
    // Common errors (1-99)
    uint16 constant UNAUTHORIZED = 1;
    uint16 constant INVALID_PARAMETER = 2;
    uint16 constant ZERO_ADDRESS = 3;
    uint16 constant ALREADY_EXISTS = 4;
    uint16 constant DOES_NOT_EXIST = 5;

    // Tribe errors (100-199)
    uint16 constant NOT_TRIBE_MEMBER = 100;
    uint16 constant ALREADY_MEMBER = 101;
    uint16 constant USER_BANNED = 102;
    uint16 constant INVALID_JOIN_TYPE = 103;
    uint16 constant INSUFFICIENT_ENTRY_FEE = 104;
    uint16 constant INVALID_INVITE_CODE = 105;
    uint16 constant INVITE_CODE_EXPIRED = 106;
    uint16 constant INVITE_CODE_USED = 107;

    // Post errors (200-299)
    uint16 constant EMPTY_METADATA = 200;
    uint16 constant INVALID_METADATA = 201;
    uint16 constant POST_NOT_FOUND = 202;
    uint16 constant POST_DELETED = 203;
    uint16 constant ALREADY_INTERACTED = 204;
    uint16 constant CANNOT_INTERACT_OWN = 205;
    uint16 constant COOLDOWN_ACTIVE = 206;

    // Collectible errors (300-399)
    uint16 constant SUPPLY_LIMIT_REACHED = 300;
    uint16 constant COLLECTIBLE_INACTIVE = 301;
    uint16 constant INSUFFICIENT_POINTS = 302;
    uint16 constant INSUFFICIENT_PAYMENT = 303;
    uint16 constant INVALID_COLLECTIBLE_CONTRACT = 304;
    uint16 constant INVALID_COLLECTIBLE = 305;
} 