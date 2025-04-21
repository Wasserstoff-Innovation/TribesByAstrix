// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FeedHelpers.sol";
import "./PostHelpers.sol";
import "./PostErrors.sol";
import "./ProjectHelpers.sol";
import "../interfaces/ICollectibleController.sol";
import "../interfaces/ITribeController.sol";
import "../interfaces/IPostMinter.sol";
import "../interfaces/IRoleManager.sol";

library PostCreationHelpers {
    using PostHelpers for bytes;
    using ProjectHelpers for bytes;

    struct PostCreationParams {
        uint256 tribeId;
        string metadata;
        bool isGated;
        address collectibleContract;
        uint256 collectibleId;
        address creator;
        uint256 nextPostId;
        IPostMinter.PostType postType;
    }

    function validateAndCreatePost(
        PostCreationParams memory params,
        ICollectibleController collectibleController
    ) internal view returns (FeedHelpers.PostData memory) {
        bytes memory metadataBytes = bytes(params.metadata);
        
        // This will throw InvalidJsonFormat error if format is invalid
        PostHelpers.validateMetadataFormat(metadataBytes);
        _validateBasicFields(metadataBytes);
        _validatePostTypeSpecificFields(metadataBytes, params.postType);
        
        // Only validate collectible for gated posts
        if (params.isGated) {
            _validateCollectible(params.collectibleContract, params.collectibleId, collectibleController);
        }

        return _createPost(params);
    }

    function _validateBasicFields(bytes memory metadataBytes) private pure {
        // Validate required fields for all post types
        if (!PostHelpers.containsField(metadataBytes, "\"title\"")) 
            revert PostErrors.MissingTitleField();
        if (!PostHelpers.containsField(metadataBytes, "\"content\"")) 
            revert PostErrors.MissingContentField();
    }

    function _validatePostTypeSpecificFields(bytes memory metadataBytes, IPostMinter.PostType postType) private pure {
        // Validate post type specific fields
        if (postType == IPostMinter.PostType.EVENT) {
            _validateEventPostFields(metadataBytes);
        } else if (postType == IPostMinter.PostType.RICH_MEDIA) {
            _validateRichMediaPostFields(metadataBytes);
        } else if (postType == IPostMinter.PostType.PROJECT_UPDATE) {
            _validateProjectPostFields(metadataBytes);
        } else if (postType == IPostMinter.PostType.POLL) {
            _validatePollPostFields(metadataBytes);
        } else if (postType == IPostMinter.PostType.COMMUNITY_UPDATE) {
            _validateCommunityUpdateFields(metadataBytes);
        } else if (postType == IPostMinter.PostType.ENCRYPTED) {
            _validateEncryptedPostFields(metadataBytes);
        } else if (postType == IPostMinter.PostType.TEXT) {
            _validateTextPostFields(metadataBytes);
        }
    }

    function _validateEventPostFields(bytes memory metadataBytes) private pure {
        if (!PostHelpers.containsField(metadataBytes, "\"eventDetails\"") ||
            PostHelpers.hasEmptyValue(metadataBytes, "\"eventDetails\"")) {
            revert PostErrors.InvalidPostType();
        }
    }

    function _validateRichMediaPostFields(bytes memory metadataBytes) private pure {
        if (!PostHelpers.containsField(metadataBytes, "\"mediaContent\"") ||
            PostHelpers.hasEmptyValue(metadataBytes, "\"mediaContent\"")) {
            revert PostErrors.InvalidPostType();
        }
    }

    function _validateProjectPostFields(bytes memory metadataBytes) private pure {
        // For initial project creation
        if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"")) {
            if (!PostHelpers.containsField(metadataBytes, "\"projectDetails\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"projectDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        }
        // For project updates
        else if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
            _validateProjectUpdate(metadataBytes);
        } else {
            revert PostErrors.InvalidPostType();
        }
    }

    function _validateProjectUpdate(bytes memory metadataBytes) private pure {
        if (!PostHelpers.containsField(metadataBytes, "\"projectDetails\"")) {
            revert PostErrors.InvalidPostType();
        }

        // Extract and validate project ID
        uint256 projectId = metadataBytes.parseProjectPostId();
        if (projectId == type(uint256).max) {
            revert PostErrors.InvalidPostType();
        }

        // Validate update type
        string memory updateType = PostHelpers.extractField(metadataBytes, "\"updateType\"");
        if (bytes(updateType).length == 0) {
            revert PostErrors.InvalidPostType();
        }

        // Validate update type specific fields
        if (PostHelpers.compareStrings(updateType, "STATUS_UPDATE")) {
            if (!PostHelpers.containsField(metadataBytes, "\"newStatus\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (PostHelpers.compareStrings(updateType, "MILESTONE_UPDATE") ||
                PostHelpers.compareStrings(updateType, "MILESTONE_SUBMISSION")) {
            if (!PostHelpers.containsField(metadataBytes, "\"milestoneIndex\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else {
            revert PostErrors.InvalidPostType();
        }

        // Check permissions
        if (!_validateProjectUpdatePermissions(metadataBytes)) {
            revert PostErrors.InsufficientAccess();
        }
    }

    function _validateCollectible(
        address collectibleContract, 
        uint256 collectibleId, 
        ICollectibleController collectibleController
    ) private view {
        if (collectibleContract == address(0)) revert PostErrors.InvalidCollectibleContract();
        if (!collectibleController.getCollectible(collectibleId).isActive) revert PostErrors.InvalidCollectible();
    }

    function _createPost(PostCreationParams memory params) private view returns (FeedHelpers.PostData memory) {
        return FeedHelpers.PostData({
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

    function _validateProjectUpdatePermissions(bytes memory metadataBytes) private pure returns (bool) {
        // For initial project creation, no additional validation needed
        if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"")) {
            return true;
        }

        // For project updates, validate project ID and team permissions
        if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
            // Extract and validate project ID
            uint256 projectId = metadataBytes.parseProjectPostId();
            if (projectId == type(uint256).max) {
                return false;
            }

            // For status updates, only check basic fields
            if (PostHelpers.containsField(metadataBytes, "\"updateType\":\"STATUS_UPDATE\"")) {
                return true;
            }

            // For milestone updates, check team permissions
            if (PostHelpers.containsField(metadataBytes, "\"updateType\":\"MILESTONE_UPDATE\"") ||
                PostHelpers.containsField(metadataBytes, "\"updateType\":\"MILESTONE_SUBMISSION\"")) {
                if (!PostHelpers.containsField(metadataBytes, "\"team\"")) {
                    return false;
                }
            }

            return true;
        }

        return true;
    }

    function validateAndCreateEncryptedPost(
        uint256 tribeId,
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner,
        address creator,
        uint256 nextPostId
    ) internal view returns (FeedHelpers.PostData memory) {
        _validateEncryptionParams(metadata, encryptionKeyHash, accessSigner);

        return FeedHelpers.PostData({
            id: nextPostId,
            creator: creator,
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
    }

    function _validateEncryptionParams(
        string memory metadata,
        bytes32 encryptionKeyHash,
        address accessSigner
    ) private pure {
        if (bytes(metadata).length == 0) revert PostErrors.EmptyMetadata();
        if (encryptionKeyHash == bytes32(0)) revert PostErrors.InvalidEncryptionKey();
        if (accessSigner == address(0)) revert PostErrors.InvalidSigner();
    }

    function _validatePollPostFields(bytes memory metadataBytes) private pure {
        if (!PostHelpers.containsField(metadataBytes, "\"options\"") ||
            PostHelpers.hasEmptyValue(metadataBytes, "\"options\"")) {
            revert PostErrors.InvalidPostType();
        }
    }

    function _validateCommunityUpdateFields(bytes memory metadataBytes) private pure {
        if (!PostHelpers.containsField(metadataBytes, "\"communityDetails\"") ||
            PostHelpers.hasEmptyValue(metadataBytes, "\"communityDetails\"")) {
            revert PostErrors.InvalidPostType();
        }
    }

    function _validateEncryptedPostFields(bytes memory metadataBytes) private pure {
        // Encrypted posts don't require additional fields beyond the basic ones
        // but we should ensure they have the right type
        if (!PostHelpers.containsField(metadataBytes, "\"type\":\"ENCRYPTED\"")) {
            revert PostErrors.InvalidPostType();
        }
    }

    function _validateTextPostFields(bytes memory metadataBytes) private pure {
        // TEXT posts don't need special fields, but if type is specified it should be TEXT
        if (PostHelpers.containsField(metadataBytes, "\"type\"") && 
            !PostHelpers.containsField(metadataBytes, "\"type\":\"TEXT\"")) {
            revert PostErrors.InvalidPostType();
        }
    }

    /**
     * @dev Provides a unified validation for all post types
     * Used to reduce code size in the main PostMinter contract
     */
    function validatePostMetadata(
        string memory metadata, 
        IPostMinter.PostType postType
    ) internal pure returns (bool) {
        bytes memory metadataBytes = bytes(metadata);
        
        // Validate basic format
        PostHelpers.validateMetadataFormat(metadataBytes);
        
        // Validate required fields for all post types
        if (!PostHelpers.containsField(metadataBytes, "\"title\"")) 
            revert PostErrors.MissingTitleField();
        if (!PostHelpers.containsField(metadataBytes, "\"content\"")) 
            revert PostErrors.MissingContentField();
        
        // Validate post type specific fields
        if (postType == IPostMinter.PostType.EVENT) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"EVENT\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"eventDetails\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"eventDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.RICH_MEDIA) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"RICH_MEDIA\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"mediaContent\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"mediaContent\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.PROJECT_UPDATE) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"") && 
                !PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"projectDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.POLL) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"POLL\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"options\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"options\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.COMMUNITY_UPDATE) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"COMMUNITY_UPDATE\"")) {
                revert PostErrors.InvalidPostType();
            }
            if (!PostHelpers.containsField(metadataBytes, "\"communityDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.ENCRYPTED) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"ENCRYPTED\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (postType == IPostMinter.PostType.TEXT) {
            if (PostHelpers.containsField(metadataBytes, "\"type\"") && 
                !PostHelpers.containsField(metadataBytes, "\"type\":\"TEXT\"")) {
                revert PostErrors.InvalidPostType();
            }
        }
        
        return true;
    }
} 