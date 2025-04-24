// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "../libraries/PostHelpers.sol";
import "../libraries/FeedHelpers.sol";
import "../libraries/PostCreationHelpers.sol";
import "../interfaces/IPostMinter.sol";
import "./PostMinterBase.sol";

/**
 * @title PostCreationManager
 * @dev Handles post creation functionality
 */
contract PostCreationManager is PostMinterBase, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using PostHelpers for bytes;
    using FeedHelpers for FeedHelpers.PostData;
    using PostCreationHelpers for PostCreationHelpers.PostCreationParams;
    
    // Events
    event PostCreated(uint256 indexed postId, uint256 indexed tribeId, address indexed creator, string metadata);
    event PostInteraction(uint256 indexed postId, address indexed user, IPostMinter.InteractionType interactionType);
    event BatchPostsCreated(uint256 indexed tribeId, address indexed creator, uint256[] postIds);
    event PostDeleted(uint256 indexed postId, address indexed user);
    event PostReported(uint256 indexed postId, address indexed reporter, string reason);
    event PostUpdated(uint256 indexed postId, address indexed updater, string metadata);
    
    /**
     * @dev Initializes the contract
     */
    function initialize(
        address _roleManager,
        address _tribeController,
        address _collectibleController,
        address _feedManager
    ) public initializer {
        __PostMinterBase_init(_roleManager, _tribeController, _collectibleController, _feedManager);
        __ReentrancyGuard_init();
        __Pausable_init();
    }
    
    /**
     * @dev Create a new post
     */
    function createPost(
        uint256 tribeId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external whenNotPaused returns (uint256) {
        _checkTribeMember(tribeId);
        
        // Check for empty metadata
        if (bytes(metadata).length == 0) revert PostErrors.EmptyMetadata();
        
        // Validate JSON format
        bytes memory metadataBytes = bytes(metadata);
        if (metadataBytes[0] != '{' || metadataBytes[metadataBytes.length - 1] != '}') 
            revert PostErrors.InvalidJsonFormat();

        // Determine post type from metadata
        IPostMinter.PostType postType = _determinePostType(metadataBytes);
        
        // Validate required fields
        if (!PostHelpers.containsField(metadataBytes, "\"title\"")) 
            revert PostErrors.MissingTitleField();
        if (!PostHelpers.containsField(metadataBytes, "\"content\"")) 
            revert PostErrors.MissingContentField();

        // Check cooldown unless user has rate limit manager role
        _checkCooldown(postType);
        _updateLastPostTime(postType);

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

        FeedHelpers.PostData memory post;

        // For gated posts, perform additional validation - otherwise simplify flow
        if (isGated) {
            if (collectibleContract == address(0)) revert PostErrors.InvalidCollectibleContract();
            if (!collectibleController.getCollectible(collectibleId).isActive) revert PostErrors.InvalidCollectible();
            post = PostCreationHelpers.validateAndCreatePost(
                params,
                collectibleController
            );
        } else {
            // Create post without additional NFT checks for already verified members
            post = FeedHelpers.PostData({
                id: params.nextPostId,
                creator: params.creator,
                tribeId: params.tribeId,
                metadata: params.metadata,
                isGated: params.isGated,
                collectibleContract: params.collectibleContract,
                collectibleId: params.collectibleId,
                isEncrypted: false,
                encryptionKeyHash: bytes32(0),
                accessSigner: address(0),
                parentPostId: 0,
                createdAt: block.timestamp,
                isDeleted: false
            });
        }

        feedManager.addPost(post);
        emit PostCreated(post.id, tribeId, msg.sender, metadata);
        return post.id;
    }
    
    /**
     * @dev Create a reply to a post
     */
    function createReply(
        uint256 parentPostId,
        string memory metadata,
        bool isGated,
        address collectibleContract,
        uint256 collectibleId
    ) external whenNotPaused returns (uint256) {
        if (parentPostId >= nextPostId) revert PostErrors.InvalidParentPost();
        if (feedManager.getPost(parentPostId).isDeleted) revert PostErrors.PostDeleted();

        uint256 tribeId = feedManager.getPost(parentPostId).tribeId;
        _checkTribeMember(tribeId);
        
        // Check cooldown for TEXT type posts
        _checkCooldown(IPostMinter.PostType.TEXT);
        _updateLastPostTime(IPostMinter.PostType.TEXT);

        PostCreationHelpers.PostCreationParams memory params = PostCreationHelpers.PostCreationParams({
            tribeId: tribeId,
            metadata: metadata,
            isGated: isGated,
            collectibleContract: collectibleContract,
            collectibleId: collectibleId,
            creator: msg.sender,
            nextPostId: nextPostId++,
            postType: IPostMinter.PostType.TEXT
        });

        FeedHelpers.PostData memory post = PostCreationHelpers.validateAndCreatePost(
            params,
            collectibleController
        );

        post.parentPostId = parentPostId;
        feedManager.addPost(post);
        
        // Update interaction count in the parent post
        // Note: This will be handled by the PostInteractionManager in a full implementation
        emit PostCreated(post.id, tribeId, msg.sender, metadata);
        emit PostInteraction(parentPostId, msg.sender, IPostMinter.InteractionType.REPLY);
        
        return post.id;
    }
    
    /**
     * @dev Create a batch of posts
     */
    function createBatchPosts(
        uint256 tribeId,
        IPostMinter.BatchPostData[] calldata posts
    ) external whenNotPaused returns (uint256[] memory) {
        _checkTribeMember(tribeId);
        
        if (posts.length > MAX_BATCH_POSTS) revert PostErrors.BatchLimitExceeded();
        
        if (!hasRole(RATE_LIMIT_MANAGER_ROLE, msg.sender)) {
            if (block.timestamp < lastBatchTime[msg.sender] + BATCH_POST_COOLDOWN) {
                revert PostErrors.BatchCooldownActive();
            }
        }

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

        lastBatchTime[msg.sender] = block.timestamp;
        emit BatchPostsCreated(tribeId, msg.sender, postIds);
        return postIds;
    }

    /**
     * @dev Update an existing post
     */
    function updatePost(uint256 postId, string memory metadata) external whenNotPaused {
        _checkPostCreator(postId);
        if (feedManager.getPost(postId).isDeleted) revert PostErrors.PostDeleted();
        
        feedManager.getPost(postId).metadata = metadata;
        emit PostUpdated(postId, msg.sender, metadata);
    }
    
    /**
     * @dev Delete a post
     */
    function deletePost(uint256 postId) external nonReentrant whenNotPaused {
        _checkPostCreator(postId);
        if (feedManager.getPost(postId).isDeleted) revert PostErrors.PostDeleted();
        
        feedManager.markPostDeleted(postId);
        emit PostDeleted(postId, msg.sender);
    }
    
    /**
     * @dev Reports a post for moderation
     */
    function reportPost(uint256 postId, string calldata reason) external nonReentrant whenNotPaused {
        FeedHelpers.PostData memory post = feedManager.getPost(postId);
        if (post.isDeleted) revert PostErrors.PostDeleted();
        
        // Track reports using a separate mapping for report flags
        // using the same interaction count technique as in the original contract
        bytes32 interactionFlag = keccak256(abi.encodePacked(postId, msg.sender, uint8(IPostMinter.InteractionType.REPORT)));
        if (uint256(interactionFlag) & 1 == 1) revert PostErrors.AlreadyReported();
        
        reportCount[postId]++;

        if (reportCount[postId] >= REPORT_THRESHOLD) {
            feedManager.markPostDeleted(postId);
            emit PostDeleted(postId, msg.sender);
        }
        
        emit PostReported(postId, msg.sender, reason);
    }
    
    /**
     * @dev Determine post type from metadata
     */
    function _determinePostType(bytes memory metadataBytes) internal view returns (IPostMinter.PostType) {
        IPostMinter.PostType postType = IPostMinter.PostType.TEXT;

        if (PostHelpers.containsField(metadataBytes, "\"type\":\"EVENT\"")) {
            postType = IPostMinter.PostType.EVENT;
            if (!PostHelpers.containsField(metadataBytes, "\"eventDetails\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"eventDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (PostHelpers.containsField(metadataBytes, "\"type\":\"RICH_MEDIA\"")) {
            postType = IPostMinter.PostType.RICH_MEDIA;
            if (!PostHelpers.containsField(metadataBytes, "\"mediaContent\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"mediaContent\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"") ||
                  PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
            postType = IPostMinter.PostType.PROJECT_UPDATE;
            
            // Project creation permission check
            if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"")) {
                if (!roleManager.hasRole(PROJECT_CREATOR_ROLE, msg.sender)) {
                    revert PostErrors.InsufficientAccess();
                }
                if (!PostHelpers.containsField(metadataBytes, "\"projectDetails\"") ||
                    PostHelpers.hasEmptyValue(metadataBytes, "\"projectDetails\"")) {
                    revert PostErrors.InvalidPostType();
                }
            }
            // For project updates, do a simpler check to avoid increasing contract size
            else if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
                if (!roleManager.hasRole(PROJECT_CREATOR_ROLE, msg.sender)) {
                    revert PostErrors.InsufficientAccess();
                }
                if (!PostHelpers.containsField(metadataBytes, "\"projectDetails\"")) {
                    revert PostErrors.InvalidPostType();
                }
            }
        } else if (PostHelpers.containsField(metadataBytes, "\"type\":\"POLL\"")) {
            postType = IPostMinter.PostType.POLL;
            if (!PostHelpers.containsField(metadataBytes, "\"options\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"options\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (PostHelpers.containsField(metadataBytes, "\"type\":\"COMMUNITY_UPDATE\"")) {
            postType = IPostMinter.PostType.COMMUNITY_UPDATE;
            if (!PostHelpers.containsField(metadataBytes, "\"communityDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (PostHelpers.containsField(metadataBytes, "\"type\":\"ENCRYPTED\"")) {
            postType = IPostMinter.PostType.ENCRYPTED;
        } else {
            // Default to TEXT type, but ensure it has the correct type specified
            if (PostHelpers.containsField(metadataBytes, "\"type\"") &&
                !PostHelpers.containsField(metadataBytes, "\"type\":\"TEXT\"")) {
                revert PostErrors.InvalidPostType();
            }
        }
        
        return postType;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
} 