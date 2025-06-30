// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FeedHelpers.sol";
import "./PostHelpers.sol";
import "./PostErrors.sol";
import "./ProjectHelpers.sol";
import "../interfaces/ICollectibleController.sol";
import "../interfaces/ITribeController.sol";
import "../interfaces/IPostMinter.sol";

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
        PostHelpers.validateMetadataFormat(metadataBytes);

        // Validate basic required fields
        string[] memory requiredFields = new string[](2);
        requiredFields[0] = "\"title\"";
        requiredFields[1] = "\"content\"";
        PostHelpers.validateRequiredFields(metadataBytes, requiredFields);

        // Validate post type specific fields
        if (params.postType == IPostMinter.PostType.EVENT) {
            if (!PostHelpers.containsField(metadataBytes, "\"eventDetails\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"eventDetails\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (params.postType == IPostMinter.PostType.RICH_MEDIA) {
            if (!PostHelpers.containsField(metadataBytes, "\"mediaContent\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"mediaContent\"")) {
                revert PostErrors.InvalidPostType();
            }
        } else if (params.postType == IPostMinter.PostType.PROJECT_UPDATE) {
            // For initial project creation
            if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"")) {
                if (!PostHelpers.containsField(metadataBytes, "\"projectDetails\"") ||
                    PostHelpers.hasEmptyValue(metadataBytes, "\"projectDetails\"")) {
                    revert PostErrors.InvalidPostType();
                }
            }
            // For project updates
            else if (PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
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
            } else {
                revert PostErrors.InvalidPostType();
            }
        }
        
        if (params.isGated) {
            if (params.collectibleContract == address(0)) revert PostErrors.InvalidCollectibleContract();
            if (!collectibleController.getCollectible(params.collectibleId).isActive) revert PostErrors.InvalidCollectible();
        }

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

    function _validateProjectUpdatePermissions(bytes memory metadataBytes) private view returns (bool) {
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
        if (bytes(metadata).length == 0) revert PostErrors.EmptyMetadata();
        if (encryptionKeyHash == bytes32(0)) revert PostErrors.InvalidEncryptionKey();
        if (accessSigner == address(0)) revert PostErrors.InvalidSigner();

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
} 