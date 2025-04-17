// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IRoleManager.sol";
import "./interfaces/ITribeController.sol";
import "./interfaces/ICollectibleController.sol";
import "./interfaces/IPostMinter.sol";
import "./constants/Errors.sol";
import "./constants/ErrorMessages.sol";
import "./libraries/PostHelpers.sol";
import "./libraries/ProjectHelpers.sol";
import "./libraries/FeedHelpers.sol";
import "./libraries/InteractionHelpers.sol";
import "./libraries/PostCreationHelpers.sol";
import "./libraries/PostErrors.sol";
import "./PostFeedManager.sol";

/// @custom:oz-upgrades-unsafe-allow constructor
/// @custom:solidity-optimizer-runs 1
contract PostMinter is IPostMinter, AccessControl, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using PostHelpers for bytes;
    using FeedHelpers for FeedHelpers.PostData;
    using InteractionHelpers for *;
    using PostCreationHelpers for *;

    // Add constant strings to reduce bytecode size
    string private constant ERROR_INVALID_METADATA = "Invalid metadata";
    string private constant ERROR_INVALID_PARENT = "Invalid parent post";
    string private constant ERROR_POST_DELETED = "Post deleted";
    string private constant ERROR_BATCH_LIMIT = "Too many posts in batch";
    string private constant ERROR_BATCH_COOLDOWN = "Please wait before batch posting";
    string private constant ERROR_INVALID_ENCRYPTION = "Invalid encryption key hash";
    string private constant ERROR_INVALID_SIGNER = "Invalid access signer";
    string private constant ERROR_INSUFFICIENT_PERMISSIONS = "Insufficient permissions";

    IRoleManager public roleManager;
    ITribeController public tribeController;
    ICollectibleController public collectibleController;
    PostFeedManager public feedManager;

    // Post storage
    uint256 public nextPostId;

    // Interaction tracking
    mapping(uint256 => mapping(address => mapping(InteractionType => bool))) private hasInteracted;
    mapping(uint256 => mapping(InteractionType => uint256)) private interactionCounts;
    mapping(uint256 => mapping(address => bool)) private authorizedViewers;

    // Encryption key storage for tribe members
    mapping(uint256 => mapping(address => bytes32)) private postDecryptionKeys;
    
    // Rate limiting
    mapping(address => mapping(PostType => uint256)) public lastPostTimeByType;
    mapping(address => uint256) public lastBatchTime;
    
    // Content moderation
    mapping(uint256 => uint256) public reportCount;
    uint256 public constant REPORT_THRESHOLD = 5;
    
    // Batch encryption keys
    mapping(uint256 => bytes32) public tribeEncryptionKeys;

    // Rate limiting
    mapping(PostType => uint256) public postTypeCooldowns;
    uint256 public constant MAX_BATCH_POSTS = 5;
    uint256 public constant BATCH_POST_COOLDOWN = 5 minutes;
    bytes32 public constant RATE_LIMIT_MANAGER_ROLE = keccak256("RATE_LIMIT_MANAGER_ROLE");

    // Add constant for project creator role
    bytes32 public constant PROJECT_CREATOR_ROLE = keccak256("PROJECT_CREATOR_ROLE");

    constructor(
        address _roleManager,
        address _tribeController,
        address _collectibleController,
        address _feedManager
    ) {
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        collectibleController = ICollectibleController(_collectibleController);
        feedManager = PostFeedManager(_feedManager);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RATE_LIMIT_MANAGER_ROLE, msg.sender);
        _grantRole(PROJECT_CREATOR_ROLE, msg.sender);

        _initializeCooldowns();
    }

    function _initializeCooldowns() private {
        postTypeCooldowns[PostType.TEXT] = 1 minutes;
        postTypeCooldowns[PostType.RICH_MEDIA] = 2 minutes;
        postTypeCooldowns[PostType.EVENT] = 30 seconds;
        postTypeCooldowns[PostType.POLL] = 5 minutes;
        postTypeCooldowns[PostType.PROJECT_UPDATE] = 2 minutes;
        postTypeCooldowns[PostType.COMMUNITY_UPDATE] = 5 minutes;
        postTypeCooldowns[PostType.ENCRYPTED] = 2 minutes;
    }

    modifier onlyTribeMember(uint256 tribeId) {
        ITribeController.MemberStatus status = tribeController.getMemberStatus(tribeId, msg.sender);
        if (status == ITribeController.MemberStatus.NONE) {
            revert PostErrors.NotTribeMember(uint(status));
        }
        _;
    }

    modifier onlyPostCreator(uint256 postId) {
        if (feedManager.getPost(postId).creator != msg.sender) {
            revert PostErrors.NotPostCreator();
        }
        _;
    }

    modifier notTooFrequent(PostType postType) {
        if (!hasRole(RATE_LIMIT_MANAGER_ROLE, msg.sender)) {
            if (block.timestamp < lastPostTimeByType[msg.sender][postType] + postTypeCooldowns[postType]) {
                revert PostErrors.CooldownActive();
            }
        }
        _;
        lastPostTimeByType[msg.sender][postType] = block.timestamp;
    }

    modifier notTooFrequentBatch() {
        if (!hasRole(RATE_LIMIT_MANAGER_ROLE, msg.sender)) {
            if (block.timestamp < lastBatchTime[msg.sender] + BATCH_POST_COOLDOWN) {
                revert PostErrors.BatchCooldownActive();
            }
        }
        _;
        lastBatchTime[msg.sender] = block.timestamp;
    }

    function createPost(
        uint256 tribeId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external override onlyTribeMember(tribeId) whenNotPaused returns (uint256) {
        if (bytes(metadata).length == 0) revert PostErrors.EmptyMetadata();

        // Parse metadata to determine post type
        bytes memory metadataBytes = bytes(metadata);
        PostType postType = PostType.TEXT;

        // Determine post type from metadata
        if (PostHelpers.containsField(metadataBytes, "\"type\":\"EVENT\"")) {
            postType = PostType.EVENT;
        } else if (PostHelpers.containsField(metadataBytes, "\"type\":\"RICH_MEDIA\"")) {
            postType = PostType.RICH_MEDIA;
        } else if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"") ||
                   PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
            postType = PostType.PROJECT_UPDATE;
            // Check project creator role for initial project creation through RoleManager
            if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"") && 
                !roleManager.hasRole(PROJECT_CREATOR_ROLE, msg.sender)) {
                revert PostErrors.InsufficientAccess();
            }
        }

        // Check cooldown unless user has rate limit manager role
        if (!hasRole(RATE_LIMIT_MANAGER_ROLE, msg.sender)) {
            uint256 lastPostTime = lastPostTimeByType[msg.sender][postType];
            uint256 cooldown = postTypeCooldowns[postType];
            if (block.timestamp < lastPostTime + cooldown) {
                revert PostErrors.CooldownActive();
            }
            lastPostTimeByType[msg.sender][postType] = block.timestamp;
        }

        PostCreationHelpers.PostCreationParams memory params = PostCreationHelpers.PostCreationParams({
            tribeId: tribeId,
            metadata: metadata,
            isGated: isGated,
            collectibleContract: collectibleContract,
            collectibleId: collectibleId,
            creator: msg.sender,
            nextPostId: nextPostId++,
            postType: postType
        });

        FeedHelpers.PostData memory post = PostCreationHelpers.validateAndCreatePost(
            params,
            collectibleController
        );

        feedManager.addPost(post);
        emit PostCreated(post.id, tribeId, msg.sender, metadata);
        return post.id;
    }

    function createReply(
        uint256 parentPostId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external onlyTribeMember(feedManager.getPost(parentPostId).tribeId) notTooFrequent(PostType.TEXT) whenNotPaused returns (uint256) {
        if (parentPostId >= nextPostId) revert PostErrors.InvalidParentPost();
        if (feedManager.getPost(parentPostId).isDeleted) revert PostErrors.PostDeleted();

        uint256 tribeId = feedManager.getPost(parentPostId).tribeId;
        PostCreationHelpers.PostCreationParams memory params = PostCreationHelpers.PostCreationParams({
            tribeId: tribeId,
            metadata: metadata,
            isGated: isGated,
            collectibleContract: collectibleContract,
            collectibleId: collectibleId,
            creator: msg.sender,
            nextPostId: nextPostId++,
            postType: PostType.TEXT
        });

        FeedHelpers.PostData memory post = PostCreationHelpers.validateAndCreatePost(
            params,
            collectibleController
        );

        post.parentPostId = parentPostId;
        feedManager.addPost(post);
        interactionCounts[parentPostId][InteractionType.REPLY]++;
        return post.id;
    }

    function createEncryptedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner
    ) external onlyTribeMember(tribeId) notTooFrequent(PostType.ENCRYPTED) whenNotPaused returns (uint256) {
        if (bytes(metadata).length == 0) revert PostErrors.EmptyMetadata();
        if (encryptionKeyHash == bytes32(0)) revert PostErrors.InvalidEncryptionKey();
        if (accessSigner == address(0)) revert PostErrors.InvalidSigner();

        uint256 postId = nextPostId++;
        FeedHelpers.PostData memory post = FeedHelpers.PostData({
            id: postId,
            creator: msg.sender,
            tribeId: tribeId,
            metadata: metadata,
            isGated: false,
            collectibleContract: address(0),
            collectibleId: 0,
            isEncrypted: true,
            encryptionKeyHash: encryptionKeyHash,
            accessSigner: accessSigner,
            parentPostId: 0,
            createdAt: block.timestamp,
            isDeleted: false
        });

        // Store decryption key for the creator
        postDecryptionKeys[postId][msg.sender] = encryptionKeyHash;
        
        // Store tribe encryption key if not already set
        if (tribeEncryptionKeys[tribeId] == bytes32(0)) {
            tribeEncryptionKeys[tribeId] = encryptionKeyHash;
        }

        feedManager.addPost(post);
        emit EncryptedPostCreated(postId, tribeId, msg.sender, metadata, encryptionKeyHash, accessSigner);
        return postId;
    }

    function createSignatureGatedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner,
        address collectibleContract,
        uint256 collectibleId
    ) external onlyTribeMember(tribeId) notTooFrequent(PostType.TEXT) whenNotPaused returns (uint256) {
        if (bytes(metadata).length == 0) revert PostErrors.EmptyMetadata();
        if (encryptionKeyHash == bytes32(0)) revert PostErrors.InvalidEncryptionKey();
        if (accessSigner == address(0)) revert PostErrors.InvalidSigner();
        if (collectibleContract != address(collectibleController)) revert PostErrors.InvalidCollectibleContract();
        if (!collectibleController.getCollectible(collectibleId).isActive) revert PostErrors.InvalidCollectible();

        uint256 postId = nextPostId++;
        FeedHelpers.PostData memory post = FeedHelpers.PostData({
            id: postId,
            creator: msg.sender,
            tribeId: tribeId,
            metadata: metadata,
            isGated: true,
            collectibleContract: collectibleContract,
            collectibleId: collectibleId,
            isEncrypted: true,
            encryptionKeyHash: encryptionKeyHash,
            accessSigner: accessSigner,
            parentPostId: 0,
            createdAt: block.timestamp,
            isDeleted: false
        });

        feedManager.addPost(post);
        emit SignatureGatedPostCreated(
            postId,
            tribeId,
            msg.sender,
            metadata,
            encryptionKeyHash,
            accessSigner,
            collectibleContract,
            collectibleId
        );
        return postId;
    }

    function deletePost(uint256 postId) external override onlyPostCreator(postId) whenNotPaused nonReentrant {
        if (feedManager.getPost(postId).isDeleted) revert PostErrors.PostDeleted();
        feedManager.markPostDeleted(postId);
        emit PostDeleted(postId, msg.sender);
    }

    function reportPost(uint256 postId, string calldata reason) external override whenNotPaused nonReentrant {
        if (feedManager.getPost(postId).isDeleted) revert PostErrors.PostDeleted();
        if (hasInteracted[postId][msg.sender][InteractionType.REPORT]) revert PostErrors.AlreadyReported();

        hasInteracted[postId][msg.sender][InteractionType.REPORT] = true;
        reportCount[postId]++;

        if (reportCount[postId] >= REPORT_THRESHOLD) {
            feedManager.getPost(postId).isDeleted = true;
            emit PostDeleted(postId, msg.sender);
        }
        
        emit PostReported(postId, msg.sender, reason);
    }

    function authorizeViewer(uint256 postId, address viewer) external override onlyPostCreator(postId) whenNotPaused {
        authorizedViewers[postId][viewer] = true;
    }

    function setTribeEncryptionKey(uint256 tribeId, bytes32 encryptionKey) external override onlyTribeMember(tribeId) whenNotPaused {
        if (tribeController.getTribeAdmin(tribeId) != msg.sender) revert PostErrors.NotTribeAdmin();
        tribeEncryptionKeys[tribeId] = encryptionKey;
    }

    function interactWithPost(uint256 postId, InteractionType interactionType) external override {
        FeedHelpers.PostData memory post = feedManager.getPost(postId);
        if (post.isDeleted) revert PostErrors.PostDeleted();
        if (post.creator == msg.sender) revert PostErrors.CannotInteractWithOwnPost();
        if (hasInteracted[postId][msg.sender][interactionType]) revert PostErrors.AlreadyInteracted();
        
        if (!canViewPost(postId, msg.sender)) {
            revert PostErrors.InsufficientAccess();
        }
        
        hasInteracted[postId][msg.sender][interactionType] = true;
        interactionCounts[postId][interactionType]++;
    }

    function canViewPost(uint256 postId, address viewer) public view override returns (bool) {
        FeedHelpers.PostData memory post = feedManager.getPost(postId);
        
        if (post.isDeleted) return false;
        
        if (authorizedViewers[postId][viewer]) return true;
        if (post.creator == viewer) return true;

        if (tribeController.getMemberStatus(post.tribeId, viewer) != ITribeController.MemberStatus.ACTIVE) {
            return false;
        }

        if (!post.isGated) {
            return true;
        }

        if (post.collectibleContract != address(0)) {
            try ICollectibleController(post.collectibleContract).balanceOf(viewer, post.collectibleId) returns (uint256 balance) {
                return balance > 0;
            } catch {
                return false;
            }
        }

        return true;
    }

    function getPostDecryptionKey(uint256 postId, address viewer) external view override returns (bytes32) {
        if (!canViewPost(postId, viewer)) revert PostErrors.InsufficientAccess();
        
        // If viewer has a direct key, return it
        if (postDecryptionKeys[postId][viewer] != bytes32(0)) {
            return postDecryptionKeys[postId][viewer];
        }
        
        // If viewer is a tribe member, derive their key
        FeedHelpers.PostData memory post = feedManager.getPost(postId);
        if (post.isEncrypted && tribeController.getMemberStatus(post.tribeId, viewer) == ITribeController.MemberStatus.ACTIVE) {
            return deriveSharedKey(post.tribeId, viewer);
        }
        
        return bytes32(0);
    }

    function verifyPostAccess(
        uint256 postId,
        address viewer,
        bytes memory signature
    ) external view override returns (bool) {
        FeedHelpers.PostData memory post = feedManager.getPost(postId);
        require(post.accessSigner != address(0), "Post not signature gated");

        bytes32 messageHash = keccak256(
            abi.encodePacked(viewer, post.tribeId)
        );
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        (address recoveredSigner, ECDSA.RecoverError error, ) = ECDSA.tryRecover(ethSignedMessageHash, signature);
        require(error == ECDSA.RecoverError.NoError, "Invalid signature");

        return recoveredSigner == post.accessSigner;
    }

    function getInteractionCount(uint256 postId, InteractionType interactionType) external view override returns (uint256) {
        return interactionCounts[postId][interactionType];
    }

    function getPostReplies(uint256 postId) external view override returns (uint256[] memory) {
        uint256[] memory replies = new uint256[](interactionCounts[postId][InteractionType.REPLY]);
        uint256 count = 0;
        
        for (uint256 i = 0; i < nextPostId; i++) {
            if (feedManager.getPost(i).parentPostId == postId && !feedManager.getPost(i).isDeleted) {
                replies[count++] = i;
            }
        }
        
        return replies;
    }

    function generatePostKey(uint256 postId) public view override returns (bytes32) {
        return keccak256(abi.encodePacked(postId, block.timestamp, msg.sender));
    }

    function deriveSharedKey(uint256 tribeId, address member) public view override returns (bytes32) {
        return keccak256(abi.encodePacked(tribeEncryptionKeys[tribeId], member));
    }

    function getPost(uint256 postId) external view override returns (
        uint256 id,
        address creator,
        uint256 tribeId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId,
        bool isEncrypted,
        address accessSigner
    ) {
        FeedHelpers.PostData memory post = feedManager.getPost(postId);
        return (
            post.id,
            post.creator,
            post.tribeId,
            post.metadata,
            post.isGated,
            post.collectibleContract,
            post.collectibleId,
            post.isEncrypted,
            post.accessSigner
        );
    }

    function pause() external override onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external override onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // New function to validate metadata
    function validateMetadata(string memory metadata, PostType postType) public pure returns (bool) {
        bytes memory metadataBytes = bytes(metadata);
        if (!PostHelpers.validateMetadataFormat(metadataBytes)) {
            return false;
        }

        // Check for required fields based on post type
        if (postType == PostType.EVENT) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"EVENT\"")) {
                return false;
            }
        } else if (postType == PostType.RICH_MEDIA) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"RICH_MEDIA\"")) {
                return false;
            }
        } else if (postType == PostType.PROJECT_UPDATE) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
                return false;
            }
        }

        // Check for empty values
        if (PostHelpers.hasEmptyValue(metadataBytes, "\"title\"") || 
            PostHelpers.hasEmptyValue(metadataBytes, "\"content\"")) {
            return false;
        }

        return true;
    }

    // New batch posting function
    function createBatchPosts(
        uint256 tribeId,
        BatchPostData[] calldata posts
    ) external override onlyTribeMember(tribeId) whenNotPaused returns (uint256[] memory) {
        require(posts.length <= MAX_BATCH_POSTS, ERROR_BATCH_LIMIT);
        require(
            block.timestamp >= lastBatchTime[msg.sender] + BATCH_POST_COOLDOWN,
            ERROR_BATCH_COOLDOWN
        );

        uint256[] memory postIds = new uint256[](posts.length);
        
        for (uint256 i = 0; i < posts.length; i++) {
            PostCreationHelpers.PostCreationParams memory params = PostCreationHelpers.PostCreationParams({
                tribeId: tribeId,
                metadata: posts[i].metadata,
                isGated: posts[i].isGated,
                collectibleContract: posts[i].collectibleContract,
                collectibleId: posts[i].collectibleId,
                creator: msg.sender,
                nextPostId: nextPostId++,
                postType: posts[i].postType
            });

            FeedHelpers.PostData memory post = PostCreationHelpers.validateAndCreatePost(
                params,
                collectibleController
            );

            feedManager.addPost(post);
            postIds[i] = post.id;
            emit PostCreated(post.id, tribeId, msg.sender, posts[i].metadata);
        }

        emit BatchPostsCreated(tribeId, msg.sender, postIds);
        return postIds;
    }

    // Rate limit management functions
    function setPostTypeCooldown(PostType postType, uint256 cooldown) external override onlyRole(RATE_LIMIT_MANAGER_ROLE) {
        postTypeCooldowns[postType] = cooldown;
        emit PostTypeCooldownUpdated(postType, cooldown);
    }

    function getPostTypeCooldown(PostType postType) external view override returns (uint256) {
        return postTypeCooldowns[postType];
    }

    function getRemainingCooldown(address user, PostType postType) external view override returns (uint256) {
        uint256 lastPost = lastPostTimeByType[user][postType];
        uint256 cooldown = postTypeCooldowns[postType];
        uint256 nextAllowedTime = lastPost + cooldown;
        
        if (block.timestamp >= nextAllowedTime) return 0;
        return nextAllowedTime - block.timestamp;
    }

    function getBatchPostingLimits() external pure override returns (uint256 maxBatchSize, uint256 batchCooldown) {
        return (MAX_BATCH_POSTS, BATCH_POST_COOLDOWN);
    }

    // Add new function for updating posts
    function updatePost(uint256 postId, string memory metadata) external {
        if (feedManager.getPost(postId).creator != msg.sender) revert PostErrors.NotPostCreator();
        if (feedManager.getPost(postId).isDeleted) revert PostErrors.PostDeleted();
        
        feedManager.getPost(postId).metadata = metadata;
        emit PostUpdated(postId, msg.sender, metadata);
    }

    // Add new event
    event PostUpdated(uint256 indexed postId, address indexed updater, string metadata);

    // Add new function to validate project update permissions
    function _validateProjectUpdatePermissions(string memory metadata) internal view returns (bool) {
        bytes memory metadataBytes = bytes(metadata);
        if (!PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
            return true;
        }

        uint256 projectPostId = ProjectHelpers.parseProjectPostId(metadataBytes);
        if (projectPostId == type(uint256).max) {
            return false;
        }

        // Get the original post
        FeedHelpers.PostData memory originalPost = feedManager.getPost(projectPostId);
        
        if (originalPost.isDeleted) {
            return false;
        }

        if (originalPost.creator == msg.sender) {
            return true;
        }

        // Check if user has update permission in the project team
        bytes memory originalMetadata = bytes(originalPost.metadata);
        if (!PostHelpers.containsField(originalMetadata, "\"team\"")) {
            return false;
        }

        return ProjectHelpers.checkUserUpdatePermission(originalMetadata, msg.sender);
    }

    // Feed querying functions
    function getPostsByTribe(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory postIds, uint256 total) {
        return feedManager.getPostsByTribe(tribeId, offset, limit);
    }

    function getPostsByUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory postIds, uint256 total) {
        return feedManager.getPostsByUser(user, offset, limit);
    }

    function getPostsByTribeAndUser(
        uint256 tribeId,
        address user,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory postIds, uint256 total) {
        return feedManager.getPostsByTribeAndUser(tribeId, user, offset, limit);
    }

    function getFeedForUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view override returns (uint256[] memory postIds, uint256 total) {
        return feedManager.getFeedForUser(user, offset, limit);
    }

    // Ultra simple function that just returns a constant
    function testCreate() external pure returns (uint256) {
        return 42;
    }
} 