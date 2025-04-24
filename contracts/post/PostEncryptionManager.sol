// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "../libraries/FeedHelpers.sol";
import "../interfaces/IPostMinter.sol";
import "./PostMinterBase.sol";

/**
 * @title PostEncryptionManager
 * @dev Handles encrypted post functionality and key management
 */
contract PostEncryptionManager is PostMinterBase {
    using ECDSAUpgradeable for bytes32;
    
    // Events
    event EncryptedPostCreated(uint256 indexed postId, uint256 indexed tribeId, address indexed creator, string metadata, bytes32 encryptionKeyHash, address accessSigner);
    event SignatureGatedPostCreated(uint256 indexed postId, uint256 indexed tribeId, address indexed creator, string metadata, bytes32 encryptionKeyHash, address accessSigner, address collectibleContract, uint256 collectibleId);
    
    // Encryption key storage
    mapping(uint256 => mapping(address => bytes32)) private postDecryptionKeys;
    mapping(uint256 => bytes32) public tribeEncryptionKeys;
    mapping(uint256 => mapping(address => bool)) private authorizedViewers;

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
    }
    
    /**
     * @dev Create an encrypted post for tribe members
     */
    function createEncryptedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner
    ) external returns (uint256) {
        _checkTribeMember(tribeId);
        _checkCooldown(IPostMinter.PostType.ENCRYPTED);
        
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
        
        _updateLastPostTime(IPostMinter.PostType.ENCRYPTED);
        return postId;
    }
    
    /**
     * @dev Create a post that requires both collectible ownership and signature for access
     */
    function createSignatureGatedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner,
        address collectibleContract,
        uint256 collectibleId
    ) external returns (uint256) {
        _checkTribeMember(tribeId);
        _checkCooldown(IPostMinter.PostType.TEXT);
        
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
        
        _updateLastPostTime(IPostMinter.PostType.TEXT);
        return postId;
    }
    
    /**
     * @dev Authorize a specific viewer to access an encrypted post
     */
    function authorizeViewer(uint256 postId, address viewer) external {
        _checkPostCreator(postId);
        authorizedViewers[postId][viewer] = true;
    }
    
    /**
     * @dev Set the tribe-wide encryption key
     */
    function setTribeEncryptionKey(uint256 tribeId, bytes32 encryptionKey) external {
        _checkTribeMember(tribeId);
        if (tribeController.getTribeAdmin(tribeId) != msg.sender) revert PostErrors.NotTribeAdmin();
        tribeEncryptionKeys[tribeId] = encryptionKey;
    }
    
    /**
     * @dev Check if a user can view a post
     */
    function canViewPost(uint256 postId, address viewer) public view returns (bool) {
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
    
    /**
     * @dev Get the decryption key for a user
     */
    function getPostDecryptionKey(uint256 postId, address viewer) external view returns (bytes32) {
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
    
    /**
     * @dev Verify post access via signature
     */
    function verifyPostAccess(
        uint256 postId,
        address viewer,
        bytes memory signature
    ) external view returns (bool) {
        FeedHelpers.PostData memory post = feedManager.getPost(postId);
        if (post.accessSigner == address(0)) revert PostErrors.InvalidSigner();

        bytes32 messageHash = keccak256(
            abi.encodePacked(viewer, post.tribeId)
        );
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n", uint256(messageHash), signature)
        );
        
        (address recoveredSigner, ECDSAUpgradeable.RecoverError error) = ECDSAUpgradeable.tryRecover(ethSignedMessageHash, signature);
        if (error != ECDSAUpgradeable.RecoverError.NoError) return false;

        return recoveredSigner == post.accessSigner;
    }
    
    /**
     * @dev Generate a unique post key
     */
    function generatePostKey(uint256 postId) public view returns (bytes32) {
        return keccak256(abi.encodePacked(postId, block.timestamp, msg.sender));
    }
    
    /**
     * @dev Derive a shared key for a tribe member
     */
    function deriveSharedKey(uint256 tribeId, address member) public view returns (bytes32) {
        return keccak256(abi.encodePacked(tribeEncryptionKeys[tribeId], member));
    }
} 