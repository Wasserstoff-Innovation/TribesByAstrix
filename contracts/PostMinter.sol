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

contract PostMinter is IPostMinter, AccessControl, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;

    IRoleManager public roleManager;
    ITribeController public tribeController;
    ICollectibleController public collectibleController;

    struct PostData {
        uint256 id;
        address creator;
        uint256 tribeId;
        string metadata;
        bool isGated;
        address collectibleContract;
        uint256 collectibleId;
        bool isEncrypted;
        bytes32 encryptionKeyHash;
        address accessSigner;
        uint256 parentPostId;
        uint256 createdAt;
        bool isDeleted;
    }

    mapping(uint256 => PostData) private postData;
    mapping(uint256 => mapping(address => mapping(InteractionType => bool))) private hasInteracted;
    mapping(uint256 => mapping(InteractionType => uint256)) private interactionCounts;
    mapping(uint256 => mapping(address => bool)) private authorizedViewers;

    // Post storage
    uint256 public nextPostId;

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

    // Post storage
    mapping(uint256 => PostData) private _posts;
    uint256 private _postCounter;
    mapping(uint256 => uint256[]) private _tribePostIds; // tribeId => postIds
    mapping(address => uint256[]) private _userPostIds; // user => postIds
    mapping(uint256 => mapping(address => uint256[])) private _tribeUserPostIds; // tribeId => user => postIds

    // New state variables for improved rate limiting
    mapping(PostType => uint256) public postTypeCooldowns;
    uint256 public constant MAX_BATCH_POSTS = 5;
    uint256 public constant BATCH_POST_COOLDOWN = 5 minutes;
    bytes32 public constant RATE_LIMIT_MANAGER_ROLE = keccak256("RATE_LIMIT_MANAGER_ROLE");

    constructor(
        address _roleManager,
        address _tribeController,
        address _collectibleController
    ) {
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        collectibleController = ICollectibleController(_collectibleController);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RATE_LIMIT_MANAGER_ROLE, msg.sender);

        // Initialize default cooldowns
        postTypeCooldowns[PostType.TEXT] = 1 minutes;
        postTypeCooldowns[PostType.RICH_MEDIA] = 2 minutes;
        postTypeCooldowns[PostType.EVENT] = 30 seconds;
        postTypeCooldowns[PostType.POLL] = 5 minutes;
        postTypeCooldowns[PostType.PROJECT_UPDATE] = 2 minutes;
        postTypeCooldowns[PostType.COMMUNITY_UPDATE] = 5 minutes;
        postTypeCooldowns[PostType.ENCRYPTED] = 2 minutes;
    }

    modifier onlyTribeMember(uint256 tribeId) {
        require(
            tribeController.getMemberStatus(tribeId, msg.sender) == ITribeController.MemberStatus.ACTIVE,
            "Not a tribe member"
        );
        _;
    }

    modifier onlyPostCreator(uint256 postId) {
        require(postData[postId].creator == msg.sender, "Not post creator");
        _;
    }

    modifier notTooFrequent(PostType postType) {
        if (!hasRole(RATE_LIMIT_MANAGER_ROLE, msg.sender)) {
            require(
                block.timestamp >= lastPostTimeByType[msg.sender][postType] + postTypeCooldowns[postType],
                "Please wait before posting again"
            );
        }
        _;
        lastPostTimeByType[msg.sender][postType] = block.timestamp;
    }

    modifier notTooFrequentBatch() {
        if (!hasRole(RATE_LIMIT_MANAGER_ROLE, msg.sender)) {
            require(
                block.timestamp >= lastBatchTime[msg.sender] + BATCH_POST_COOLDOWN,
                "Please wait before batch posting"
            );
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
    ) external override onlyTribeMember(tribeId) notTooFrequent(PostType.TEXT) whenNotPaused returns (uint256) {
        // Parse metadata to determine post type
        PostType postType = PostType.TEXT;
        bytes memory metadataBytes = bytes(metadata);
        
        // Check for post type in metadata
        if (_containsField(metadataBytes, "\"type\":\"EVENT\"")) {
            postType = PostType.EVENT;
        } else if (_containsField(metadataBytes, "\"type\":\"RICH_MEDIA\"")) {
            postType = PostType.RICH_MEDIA;
        } else if (_containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
            postType = PostType.PROJECT_UPDATE;
            // Validate project update permissions
            require(_validateProjectUpdatePermissions(metadata), "Insufficient permissions");
        }

        // Validate metadata based on post type
        if (!validateMetadata(metadata, postType)) {
            revert("Invalid metadata format");
        }
        
        if (isGated) {
            require(
                collectibleContract == address(collectibleController),
                "Invalid collectible contract"
            );
            require(
                collectibleController.getCollectible(collectibleId).isActive,
                "Invalid collectible"
            );
        }

        uint256 postId = nextPostId++;
        postData[postId] = PostData({
            id: postId,
            creator: msg.sender,
            tribeId: tribeId,
            metadata: metadata,
            isGated: isGated,
            collectibleContract: collectibleContract,
            collectibleId: collectibleId,
            isEncrypted: false,
            encryptionKeyHash: bytes32(0),
            accessSigner: address(0),
            parentPostId: 0,
            createdAt: block.timestamp,
            isDeleted: false
        });

        // Track post in feed mappings
        _tribePostIds[tribeId].push(postId);
        _userPostIds[msg.sender].push(postId);
        _tribeUserPostIds[tribeId][msg.sender].push(postId);

        emit PostCreated(postId, tribeId, msg.sender, metadata);
        return postId;
    }

    function createReply(
        uint256 parentPostId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external onlyTribeMember(postData[parentPostId].tribeId) notTooFrequent(PostType.TEXT) whenNotPaused returns (uint256) {
        require(parentPostId < nextPostId, "Invalid parent post");
        require(!postData[parentPostId].isDeleted, "Parent post deleted");

        uint256 postId = this.createPost(
            postData[parentPostId].tribeId,
            metadata,
            isGated,
            collectibleContract,
            collectibleId
        );
        postData[postId].parentPostId = parentPostId;
        interactionCounts[parentPostId][InteractionType.REPLY]++;
        return postId;
    }

    function createEncryptedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner
    ) external onlyTribeMember(tribeId) notTooFrequent(PostType.ENCRYPTED) whenNotPaused returns (uint256) {
        require(bytes(metadata).length > 0, "Invalid metadata");
        require(encryptionKeyHash != bytes32(0), "Invalid encryption key hash");
        require(accessSigner != address(0), "Invalid access signer");

        uint256 postId = nextPostId++;
        postData[postId] = PostData({
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

        // Track post in feed mappings
        _tribePostIds[tribeId].push(postId);
        _userPostIds[msg.sender].push(postId);
        _tribeUserPostIds[tribeId][msg.sender].push(postId);

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
        require(bytes(metadata).length > 0, "Invalid metadata");
        require(encryptionKeyHash != bytes32(0), "Invalid encryption key hash");
        require(accessSigner != address(0), "Invalid access signer");
        require(
            collectibleContract == address(collectibleController),
            "Invalid collectible contract"
        );
        require(
            collectibleController.getCollectible(collectibleId).isActive,
            "Invalid collectible"
        );

        uint256 postId = nextPostId++;
        postData[postId] = PostData({
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

        // Track post in feed mappings
        _tribePostIds[tribeId].push(postId);
        _userPostIds[msg.sender].push(postId);
        _tribeUserPostIds[tribeId][msg.sender].push(postId);

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
        require(!postData[postId].isDeleted, "Post already deleted");
        postData[postId].isDeleted = true;
        emit PostDeleted(postId, msg.sender);
    }

    function reportPost(uint256 postId, string calldata reason) external override whenNotPaused nonReentrant {
        require(!postData[postId].isDeleted, "Post deleted");
        require(!hasInteracted[postId][msg.sender][InteractionType.REPORT], "Already reported");

        hasInteracted[postId][msg.sender][InteractionType.REPORT] = true;
        reportCount[postId]++;

        if (reportCount[postId] >= REPORT_THRESHOLD) {
            postData[postId].isDeleted = true;
            emit PostDeleted(postId, msg.sender);
        }
        
        emit PostReported(postId, msg.sender, reason);
    }

    function authorizeViewer(uint256 postId, address viewer) external override onlyPostCreator(postId) whenNotPaused {
        authorizedViewers[postId][viewer] = true;
    }

    function setTribeEncryptionKey(uint256 tribeId, bytes32 encryptionKey) external override onlyTribeMember(tribeId) whenNotPaused {
        require(tribeController.getTribeAdmin(tribeId) == msg.sender, "Not tribe admin");
        tribeEncryptionKeys[tribeId] = encryptionKey;
    }

    function interactWithPost(uint256 postId, InteractionType interactionType) external override whenNotPaused {
        require(!postData[postId].isDeleted, "Post deleted");
        require(!hasInteracted[postId][msg.sender][interactionType], "Already interacted");
        require(canViewPost(postId, msg.sender), "Cannot view post");
        
        // Prevent self-likes
        if (interactionType == InteractionType.LIKE) {
            require(postData[postId].creator != msg.sender, "Cannot like own post");
        }

        hasInteracted[postId][msg.sender][interactionType] = true;
        interactionCounts[postId][interactionType]++;
    }

    function canViewPost(uint256 postId, address viewer) public view override returns (bool) {
        PostData storage post = postData[postId];
        
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
            return ICollectibleController(post.collectibleContract).balanceOf(viewer, post.collectibleId) > 0;
        }

        return true;
    }

    function getPostDecryptionKey(uint256 postId, address viewer) external view override returns (bytes32) {
        require(canViewPost(postId, viewer), "Not authorized to view post");
        
        // If viewer has a direct key, return it
        if (postDecryptionKeys[postId][viewer] != bytes32(0)) {
            return postDecryptionKeys[postId][viewer];
        }
        
        // If viewer is a tribe member, derive their key
        PostData storage post = postData[postId];
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
        PostData storage post = postData[postId];
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
            if (postData[i].parentPostId == postId && !postData[i].isDeleted) {
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
        PostData storage post = postData[postId];
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

    // Feed querying functions
    function getPostsByTribe(
        uint256 tribeId,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory postIds,
        uint256 total
    ) {
        uint256[] storage allPosts = _tribePostIds[tribeId];
        total = 0;
        
        // Count only non-deleted posts
        for (uint256 i = 0; i < allPosts.length; i++) {
            if (!postData[allPosts[i]].isDeleted) {
                total++;
            }
        }
        
        if (offset >= total) {
            return (new uint256[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 resultLength = end - offset;
        postIds = new uint256[](resultLength);
        
        // Fill array with non-deleted posts
        uint256 currentIndex = 0;
        uint256 skipped = 0;
        for (uint256 i = 0; i < allPosts.length && currentIndex < resultLength; i++) {
            if (!postData[allPosts[i]].isDeleted) {
                if (skipped >= offset) {
                    postIds[currentIndex] = allPosts[i];
                    currentIndex++;
                } else {
                    skipped++;
                }
            }
        }
        
        return (postIds, total);
    }

    function getPostsByUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory postIds,
        uint256 total
    ) {
        uint256[] storage allPosts = _userPostIds[user];
        total = 0;
        
        // Count only non-deleted posts
        for (uint256 i = 0; i < allPosts.length; i++) {
            if (!postData[allPosts[i]].isDeleted) {
                total++;
            }
        }
        
        if (offset >= total) {
            return (new uint256[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 resultLength = end - offset;
        postIds = new uint256[](resultLength);
        
        // Fill array with non-deleted posts
        uint256 currentIndex = 0;
        uint256 skipped = 0;
        for (uint256 i = 0; i < allPosts.length && currentIndex < resultLength; i++) {
            if (!postData[allPosts[i]].isDeleted) {
                if (skipped >= offset) {
                    postIds[currentIndex] = allPosts[i];
                    currentIndex++;
                } else {
                    skipped++;
                }
            }
        }
        
        return (postIds, total);
    }

    function getPostsByTribeAndUser(
        uint256 tribeId,
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory postIds,
        uint256 total
    ) {
        uint256[] storage allPosts = _tribeUserPostIds[tribeId][user];
        total = allPosts.length;
        
        if (offset >= total) {
            return (new uint256[](0), total);
        }
        
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        
        uint256 resultLength = end - offset;
        postIds = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            postIds[i] = allPosts[total - (offset + i + 1)]; // Return most recent first
        }
        
        return (postIds, total);
    }

    function getFeedForUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory postIds,
        uint256 total
    ) {
        // Get all tribes the user is a member of
        uint256[] memory userTribes = tribeController.getUserTribes(user);
        
        // First pass: count total posts
        total = 0;
        for (uint256 i = 0; i < userTribes.length; i++) {
            total += _tribePostIds[userTribes[i]].length;
        }
        
        if (offset >= total || limit == 0) {
            return (new uint256[](0), total);
        }
        
        // Create arrays to store all posts and their timestamps
        uint256[] memory allPosts = new uint256[](total);
        uint256[] memory timestamps = new uint256[](total);
        uint256 currentIndex = 0;
        
        // Second pass: collect all posts and timestamps
        for (uint256 i = 0; i < userTribes.length; i++) {
            uint256[] storage tribePosts = _tribePostIds[userTribes[i]];
            for (uint256 j = 0; j < tribePosts.length; j++) {
                allPosts[currentIndex] = tribePosts[j];
                timestamps[currentIndex] = postData[tribePosts[j]].createdAt;
                currentIndex++;
            }
        }
        
        // Sort posts by timestamp (bubble sort)
        for (uint256 i = 0; i < total - 1; i++) {
            for (uint256 j = 0; j < total - i - 1; j++) {
                if (timestamps[j] < timestamps[j + 1]) {
                    // Swap timestamps
                    uint256 tempTimestamp = timestamps[j];
                    timestamps[j] = timestamps[j + 1];
                    timestamps[j + 1] = tempTimestamp;
                    
                    // Swap posts
                    uint256 tempPost = allPosts[j];
                    allPosts[j] = allPosts[j + 1];
                    allPosts[j + 1] = tempPost;
                }
            }
        }
        
        // Return paginated results
        uint256 end = offset + limit > total ? total : offset + limit;
        uint256 resultLength = end - offset;
        postIds = new uint256[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            postIds[i] = allPosts[offset + i];
        }
        
        return (postIds, total);
    }

    // New function to validate metadata
    function validateMetadata(string memory metadata, PostType postType) public pure override returns (bool) {
        bytes memory metadataBytes = bytes(metadata);
        if (metadataBytes.length == 0) return false;
        
        // Basic JSON validation (opening/closing braces)
        if (metadataBytes[0] != "{" || metadataBytes[metadataBytes.length - 1] != "}") {
            return false;
        }

        // For testing purposes, we'll do basic string checks
        // In production, we would use a proper JSON parser
        bool hasTitle = _containsField(metadataBytes, "\"title\"");
        bool hasContent = _containsField(metadataBytes, "\"content\"");
        
        if (!hasTitle || !hasContent) {
            return false;
        }

        // Additional validation for specific post types
        if (postType == PostType.EVENT) {
            if (!_containsField(metadataBytes, "\"eventDetails\"")) {
                return false;
            }
        } else if (postType == PostType.RICH_MEDIA) {
            if (!_containsField(metadataBytes, "\"mediaContent\"")) {
                return false;
            }
        }

        return true;
    }

    function _containsField(bytes memory json, string memory field) private pure returns (bool) {
        bytes memory fieldBytes = bytes(field);
        bytes memory jsonBytes = json;
        
        if (jsonBytes.length < fieldBytes.length) return false;
        
        for (uint i = 0; i < jsonBytes.length - fieldBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < fieldBytes.length; j++) {
                if (jsonBytes[i + j] != fieldBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    // New batch posting function
    function createBatchPosts(
        uint256 tribeId,
        BatchPostData[] calldata posts
    ) external override onlyTribeMember(tribeId) whenNotPaused returns (uint256[] memory) {
        require(posts.length <= MAX_BATCH_POSTS, "Too many posts in batch");
        require(
            block.timestamp >= lastBatchTime[msg.sender] + BATCH_POST_COOLDOWN,
            "Please wait before batch posting"
        );

        uint256[] memory postIds = new uint256[](posts.length);
        
        for (uint256 i = 0; i < posts.length; i++) {
            require(validateMetadata(posts[i].metadata, posts[i].postType), "Invalid metadata format");
            
            uint256 postId = nextPostId++;
            postData[postId] = PostData({
                id: postId,
                creator: msg.sender,
                tribeId: tribeId,
                metadata: posts[i].metadata,
                isGated: posts[i].isGated,
                collectibleContract: posts[i].collectibleContract,
                collectibleId: posts[i].collectibleId,
                isEncrypted: false,
                encryptionKeyHash: bytes32(0),
                accessSigner: address(0),
                parentPostId: 0,
                createdAt: block.timestamp,
                isDeleted: false
            });

            _tribePostIds[tribeId].push(postId);
            _userPostIds[msg.sender].push(postId);
            _tribeUserPostIds[tribeId][msg.sender].push(postId);
            
            postIds[i] = postId;
            emit PostCreated(postId, tribeId, msg.sender, posts[i].metadata);
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
        require(postData[postId].creator == msg.sender, "Not post creator");
        require(!postData[postId].isDeleted, "Post deleted");
        
        postData[postId].metadata = metadata;
        emit PostUpdated(postId, msg.sender, metadata);
    }

    // Add new event
    event PostUpdated(uint256 indexed postId, address indexed updater, string metadata);

    // Add new function to validate project update permissions
    function _validateProjectUpdatePermissions(string memory metadata) internal view returns (bool) {
        bytes memory metadataBytes = bytes(metadata);
        if (!_containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
            return true;
        }

        uint256 projectPostId = _parseProjectPostId(metadataBytes);
        if (projectPostId == type(uint256).max) {
            return false;
        }

        // Get the original post
        PostData storage originalPost = postData[projectPostId];
        
        // Check if the post exists and is not deleted
        if (originalPost.isDeleted) {
            return false;
        }

        // Allow the original post creator to update
        if (originalPost.creator == msg.sender) {
            return true;
        }

        // Check team permissions in the original post metadata
        bytes memory originalMetadataBytes = bytes(originalPost.metadata);
        return _checkUserUpdatePermission(originalMetadataBytes);
    }

    function _parseProjectPostId(bytes memory metadataBytes) internal pure returns (uint256) {
        bytes memory projectPostIdField = bytes("\"projectPostId\":");
        bytes memory originalPostIdField = bytes("\"originalPostId\":");
        
        // Try projectPostId first
        uint256 projectId = _findAndParseId(metadataBytes, projectPostIdField);
        if (projectId != type(uint256).max) {
            return projectId;
        }
        
        // Try originalPostId if projectPostId not found
        return _findAndParseId(metadataBytes, originalPostIdField);
    }

    function _findAndParseId(bytes memory metadataBytes, bytes memory idField) internal pure returns (uint256) {
        // Find id field in metadata
        for (uint i = 0; i < metadataBytes.length - idField.length; i++) {
            bool found = true;
            for (uint j = 0; j < idField.length; j++) {
                if (metadataBytes[i + j] != idField[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                // Parse the id value
                uint256 startIndex = i + idField.length;
                while (startIndex < metadataBytes.length && 
                       (metadataBytes[startIndex] == ' ' || metadataBytes[startIndex] == '"' || 
                        metadataBytes[startIndex] == ':')) {
                    startIndex++;
                }
                
                uint256 endIndex = startIndex;
                uint256 id;
                while (endIndex < metadataBytes.length && 
                       metadataBytes[endIndex] >= '0' && metadataBytes[endIndex] <= '9') {
                    uint256 digit = uint8(metadataBytes[endIndex]) - 48;
                    if (id > (type(uint256).max - digit) / 10) {
                        // Would overflow
                        return type(uint256).max;
                    }
                    id = id * 10 + digit;
                    endIndex++;
                }
                return id;
            }
        }
        return type(uint256).max;
    }

    function _checkUserUpdatePermission(bytes memory originalMetadataBytes) internal view returns (bool) {
        bytes memory teamField = bytes("\"team\":[");
        
        // Find team array in metadata
        for (uint i = 0; i < originalMetadataBytes.length - teamField.length; i++) {
            bool found = true;
            for (uint j = 0; j < teamField.length; j++) {
                if (originalMetadataBytes[i + j] != teamField[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                // Found team array, now look for the current user's entry
                bytes memory addressField = abi.encodePacked("\"address\":\"", toAsciiString(msg.sender), "\"");
                uint256 teamIndex = i + teamField.length;
                
                while (teamIndex < originalMetadataBytes.length && originalMetadataBytes[teamIndex] != ']') {
                    bool foundUser = true;
                    for (uint j = 0; j < addressField.length; j++) {
                        if (teamIndex + j >= originalMetadataBytes.length || 
                            originalMetadataBytes[teamIndex + j] != addressField[j]) {
                            foundUser = false;
                            break;
                        }
                    }
                    
                    if (foundUser) {
                        // Found user, now check for UPDATE permission
                        bytes memory permissionsField = bytes("\"permissions\":");
                        uint256 permissionIndex = teamIndex;
                        
                        // Look for permissions field
                        while (permissionIndex < originalMetadataBytes.length && originalMetadataBytes[permissionIndex] != ']') {
                            bool foundPermissions = true;
                            for (uint j = 0; j < permissionsField.length; j++) {
                                if (permissionIndex + j >= originalMetadataBytes.length || 
                                    originalMetadataBytes[permissionIndex + j] != permissionsField[j]) {
                                    foundPermissions = false;
                                    break;
                                }
                            }
                            
                            if (foundPermissions) {
                                // Skip whitespace and opening brackets/quotes
                                permissionIndex += permissionsField.length;
                                while (permissionIndex < originalMetadataBytes.length && 
                                       (originalMetadataBytes[permissionIndex] == ' ' || 
                                        originalMetadataBytes[permissionIndex] == '[' || 
                                        originalMetadataBytes[permissionIndex] == '"')) {
                                    permissionIndex++;
                                }
                                
                                // Check for "UPDATE" in either string or array format
                                bytes memory updatePermission = bytes("UPDATE");
                                bool hasUpdate = true;
                                for (uint j = 0; j < updatePermission.length; j++) {
                                    if (permissionIndex + j >= originalMetadataBytes.length || 
                                        originalMetadataBytes[permissionIndex + j] != updatePermission[j]) {
                                        hasUpdate = false;
                                        break;
                                    }
                                }
                                if (hasUpdate) {
                                    return true;
                                }
                            }
                            permissionIndex++;
                        }
                        return false;
                    }
                    teamIndex++;
                }
                break;
            }
        }
        return false;
    }

    // Helper function to convert address to ASCII string
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    // Helper function to convert byte to char
    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
} 