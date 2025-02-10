// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPostMinter {
    enum InteractionType { 
        LIKE,
        COMMENT,
        SHARE,
        BOOKMARK,
        REPORT,
        REPLY,
        MENTION,
        REPOST,
        TIP
    }

    event PostCreated(uint256 indexed postId, uint256 indexed tribeId, address indexed creator, string metadata);
    event EncryptedPostCreated(uint256 indexed postId, uint256 indexed tribeId, address indexed creator, string metadata, bytes32 encryptionKeyHash, address accessSigner);
    event SignatureGatedPostCreated(uint256 indexed postId, uint256 indexed tribeId, address indexed creator, string metadata, bytes32 encryptionKeyHash, address accessSigner, address collectibleContract, uint256 collectibleId);
    event PostInteraction(uint256 indexed postId, address indexed user, InteractionType interactionType);
    event PostDeleted(uint256 indexed postId, address indexed deleter);
    event PostReported(uint256 indexed postId, address indexed reporter, string reason);
    event ViewerAuthorized(uint256 indexed postId, address indexed viewer);
    event TribeKeyUpdated(uint256 indexed tribeId, bytes32 indexed keyHash);

    function createPost(
        uint256 tribeId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external returns (uint256);

    function createReply(
        uint256 parentPostId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external returns (uint256);

    function createEncryptedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner
    ) external returns (uint256);

    function createSignatureGatedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner,
        address collectibleContract,
        uint256 collectibleId
    ) external returns (uint256);

    function deletePost(uint256 postId) external;

    function reportPost(uint256 postId, string calldata reason) external;

    function authorizeViewer(uint256 postId, address viewer) external;

    function setTribeEncryptionKey(uint256 tribeId, bytes32 encryptionKey) external;

    function interactWithPost(uint256 postId, InteractionType interactionType) external;

    function canViewPost(uint256 postId, address viewer) external view returns (bool);

    function getPostDecryptionKey(uint256 postId, address viewer) external view returns (bytes32);

    function verifyPostAccess(
        uint256 postId,
        address viewer,
        bytes memory signature
    ) external view returns (bool);

    function getInteractionCount(uint256 postId, InteractionType interactionType) external view returns (uint256);

    function getPostReplies(uint256 postId) external view returns (uint256[] memory);

    function generatePostKey(uint256 postId) external view returns (bytes32);

    function deriveSharedKey(uint256 tribeId, address member) external view returns (bytes32);

    function getPost(uint256 postId) external view returns (
        uint256 id,
        address creator,
        uint256 tribeId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId,
        bool isEncrypted,
        address accessSigner
    );

    function pause() external;
    function unpause() external;

    // Feed querying functions
    function getPostsByTribe(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory postIds,
        uint256 total
    );

    function getPostsByUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory postIds,
        uint256 total
    );

    function getPostsByTribeAndUser(
        uint256 tribeId,
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory postIds,
        uint256 total
    );

    function getFeedForUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory postIds,
        uint256 total
    );
} 