pragma solidity ^0.8.0;

interface IPostMinter {
    // Post structure
    struct Post {
        address author;
        uint256 tribeId;
        string metadataHash; // IPFS/Arweave hash of post metadata
        //... other fields like post type, timestamp, etc.
    }

    // Create a new post
    function createPost(uint256 tribeId, string memory metadataHash) external;

    //... other functions for interacting with posts (e.g., commenting, liking)
}