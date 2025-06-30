// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library InteractionHelpers {
    function validateInteraction(
        uint256 postId,
        address interactor,
        address creator,
        uint8 interactionType,
        mapping(uint256 => mapping(address => mapping(uint8 => bool))) storage hasInteracted
    ) internal view returns (bool) {
        require(interactionType < 5, "Invalid interaction type");
        require(interactor != creator, "Cannot interact with own post");
        require(!hasInteracted[postId][interactor][interactionType], "Already interacted");
        return true;
    }

    function recordInteraction(
        uint256 postId,
        address interactor,
        uint8 interactionType,
        mapping(uint256 => mapping(address => mapping(uint8 => bool))) storage hasInteracted,
        mapping(uint256 => mapping(uint8 => uint256)) storage interactionCounts
    ) internal {
        hasInteracted[postId][interactor][interactionType] = true;
        interactionCounts[postId][interactionType]++;
    }
} 