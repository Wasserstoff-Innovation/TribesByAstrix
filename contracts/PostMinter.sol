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
    mapping(address => uint256) public lastPostTime;
    uint256 public constant POST_COOLDOWN = 1 minutes;
    
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

    constructor(
        address _roleManager,
        address _tribeController,
        address _collectibleController
    ) {
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        collectibleController = ICollectibleController(_collectibleController);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
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

    modifier notTooFrequent() {
        require(
            block.timestamp >= lastPostTime[msg.sender] + POST_COOLDOWN,
            "Please wait before posting again"
        );
        _;
    }

    function createPost(
        uint256 tribeId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external onlyTribeMember(tribeId) notTooFrequent whenNotPaused returns (uint256) {
        require(bytes(metadata).length > 0, "Invalid metadata");
        
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

        lastPostTime[msg.sender] = block.timestamp;
        emit PostCreated(postId, tribeId, msg.sender, metadata);
        return postId;
    }

    function createReply(
        uint256 parentPostId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external onlyTribeMember(postData[parentPostId].tribeId) notTooFrequent whenNotPaused returns (uint256) {
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
    ) external onlyTribeMember(tribeId) notTooFrequent whenNotPaused returns (uint256) {
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

        lastPostTime[msg.sender] = block.timestamp;
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
    ) external onlyTribeMember(tribeId) notTooFrequent whenNotPaused returns (uint256) {
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

        lastPostTime[msg.sender] = block.timestamp;
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
    }

    function reportPost(uint256 postId, string calldata reason) external override whenNotPaused nonReentrant {
        require(!postData[postId].isDeleted, "Post deleted");
        require(!hasInteracted[postId][msg.sender][InteractionType.REPORT], "Already reported");

        hasInteracted[postId][msg.sender][InteractionType.REPORT] = true;
        reportCount[postId]++;

        if (reportCount[postId] >= REPORT_THRESHOLD) {
            postData[postId].isDeleted = true;
        }
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

    function getPostsByUser(
        address user,
        uint256 offset,
        uint256 limit
    ) external view returns (
        uint256[] memory postIds,
        uint256 total
    ) {
        uint256[] storage allPosts = _userPostIds[user];
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
} 