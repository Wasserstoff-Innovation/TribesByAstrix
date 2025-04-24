// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "../interfaces/IRoleManager.sol";
import "../interfaces/ITribeController.sol";
import "../interfaces/ICollectibleController.sol";
import "../interfaces/IPostMinter.sol";
import "../libraries/PostErrors.sol";
import "../PostFeedManager.sol";

/**
 * @title PostMinterBase
 * @dev Base contract for the PostMinter system with shared state and functionality
 */
abstract contract PostMinterBase is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    // Constants
    uint256 public constant MAX_BATCH_POSTS = 5;
    uint256 public constant BATCH_POST_COOLDOWN = 5 minutes;
    uint256 public constant REPORT_THRESHOLD = 5;
    bytes32 public constant RATE_LIMIT_MANAGER_ROLE = keccak256("RATE_LIMIT_MANAGER_ROLE");
    bytes32 public constant PROJECT_CREATOR_ROLE = keccak256("PROJECT_CREATOR_ROLE");
    
    // Events
    event PostTypeCooldownUpdated(IPostMinter.PostType indexed postType, uint256 cooldown);

    // Core contracts
    IRoleManager public roleManager;
    ITribeController public tribeController;
    ICollectibleController public collectibleController;
    PostFeedManager public feedManager;

    // Post storage
    uint256 public nextPostId;

    // Cooldowns and rate limits
    mapping(address => mapping(IPostMinter.PostType => uint256)) public lastPostTimeByType;
    mapping(address => uint256) public lastBatchTime;
    mapping(IPostMinter.PostType => uint256) public postTypeCooldowns;

    // Report tracking
    mapping(uint256 => uint256) public reportCount;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract replacing the constructor
     */
    function __PostMinterBase_init(
        address _roleManager,
        address _tribeController,
        address _collectibleController,
        address _feedManager
    ) internal onlyInitializing {
        __AccessControl_init();
        __UUPSUpgradeable_init();
        
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        collectibleController = ICollectibleController(_collectibleController);
        feedManager = PostFeedManager(_feedManager);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(RATE_LIMIT_MANAGER_ROLE, msg.sender);
        _grantRole(PROJECT_CREATOR_ROLE, msg.sender);

        _initializeCooldowns();
    }

    /**
     * @dev Function that should revert when `msg.sender` is not authorized to upgrade the contract.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @dev Initialize cooldown times for different post types
     */
    function _initializeCooldowns() private {
        postTypeCooldowns[IPostMinter.PostType.TEXT] = 1 minutes;
        postTypeCooldowns[IPostMinter.PostType.RICH_MEDIA] = 2 minutes;
        postTypeCooldowns[IPostMinter.PostType.EVENT] = 30 seconds;
        postTypeCooldowns[IPostMinter.PostType.POLL] = 5 minutes;
        postTypeCooldowns[IPostMinter.PostType.PROJECT_UPDATE] = 2 minutes;
        postTypeCooldowns[IPostMinter.PostType.COMMUNITY_UPDATE] = 5 minutes;
        postTypeCooldowns[IPostMinter.PostType.ENCRYPTED] = 2 minutes;
    }

    /**
     * @dev Check if sender is a member of the tribe
     */
    function _checkTribeMember(uint256 tribeId) internal view {
        if (tribeController.getMemberStatus(tribeId, msg.sender) != ITribeController.MemberStatus.ACTIVE) {
            revert PostErrors.NotTribeMember(uint(tribeController.getMemberStatus(tribeId, msg.sender)));
        }
    }

    /**
     * @dev Check if sender is the creator of the post
     */
    function _checkPostCreator(uint256 postId) internal view {
        if (feedManager.getPost(postId).creator != msg.sender) {
            revert PostErrors.NotPostCreator();
        }
    }

    /**
     * @dev Check if the post creation cooldown is active
     */
    function _checkCooldown(IPostMinter.PostType postType) internal view {
        if (!hasRole(RATE_LIMIT_MANAGER_ROLE, msg.sender)) {
            if (block.timestamp < lastPostTimeByType[msg.sender][postType] + postTypeCooldowns[postType]) {
                revert PostErrors.CooldownActive();
            }
        }
    }

    /**
     * @dev Update the last post time for rate limiting
     */
    function _updateLastPostTime(IPostMinter.PostType postType) internal {
        lastPostTimeByType[msg.sender][postType] = block.timestamp;
    }

    // Rate limit management functions
    function setPostTypeCooldown(IPostMinter.PostType postType, uint256 cooldown) external onlyRole(RATE_LIMIT_MANAGER_ROLE) {
        postTypeCooldowns[postType] = cooldown;
        emit PostTypeCooldownUpdated(postType, cooldown);
    }

    function getPostTypeCooldown(IPostMinter.PostType postType) external view returns (uint256) {
        return postTypeCooldowns[postType];
    }

    function getRemainingCooldown(address user, IPostMinter.PostType postType) external view returns (uint256) {
        uint256 lastPost = lastPostTimeByType[user][postType];
        uint256 cooldown = postTypeCooldowns[postType];
        uint256 nextAllowedTime = lastPost + cooldown;
        
        if (block.timestamp >= nextAllowedTime) return 0;
        return nextAllowedTime - block.timestamp;
    }

    function getBatchPostingLimits() external pure returns (uint256 maxBatchSize, uint256 batchCooldown) {
        return (MAX_BATCH_POSTS, BATCH_POST_COOLDOWN);
    }
} 