// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PostMinter {
    uint256 public nextPostId;

    event PostCreated(uint256 indexed postId, uint256 indexed tribeId, address indexed creator, string content);

    function createPost(uint256 tribeId, string calldata content) external returns (uint256) {
        uint256 postId = nextPostId++;
        // Include any role or NFT ownership checks as required.
        emit PostCreated(postId, tribeId, msg.sender, content);
        return postId;
    }
} 