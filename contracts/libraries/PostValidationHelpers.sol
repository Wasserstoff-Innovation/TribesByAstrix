// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PostHelpers.sol";
import "../interfaces/IPostMinter.sol";

library PostValidationHelpers {
    using PostHelpers for bytes;

    function validatePostType(bytes memory metadataBytes, IPostMinter.PostType postType) internal pure returns (bool) {
        if (postType == IPostMinter.PostType.EVENT) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"EVENT\"")) {
                return false;
            }
            if (!PostHelpers.containsField(metadataBytes, "\"eventDetails\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"eventDetails\"")) {
                return false;
            }
        } else if (postType == IPostMinter.PostType.RICH_MEDIA) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"RICH_MEDIA\"")) {
                return false;
            }
            if (!PostHelpers.containsField(metadataBytes, "\"mediaContent\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"mediaContent\"")) {
                return false;
            }
        } else if (postType == IPostMinter.PostType.PROJECT_UPDATE) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"") && 
                !PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT\"")) {
                return false;
            }
            if (!PostHelpers.containsField(metadataBytes, "\"projectDetails\"")) {
                return false;
            }
        } else if (postType == IPostMinter.PostType.POLL) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"POLL\"")) {
                return false;
            }
            if (!PostHelpers.containsField(metadataBytes, "\"options\"") ||
                PostHelpers.hasEmptyValue(metadataBytes, "\"options\"")) {
                return false;
            }
        } else if (postType == IPostMinter.PostType.COMMUNITY_UPDATE) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"COMMUNITY_UPDATE\"")) {
                return false;
            }
            if (!PostHelpers.containsField(metadataBytes, "\"communityDetails\"")) {
                return false;
            }
        } else if (postType == IPostMinter.PostType.ENCRYPTED) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"ENCRYPTED\"")) {
                return false;
            }
        } else if (postType == IPostMinter.PostType.TEXT) {
            if (PostHelpers.containsField(metadataBytes, "\"type\"") && 
                !PostHelpers.containsField(metadataBytes, "\"type\":\"TEXT\"")) {
                return false;
            }
        }
        return true;
    }

    function validateMetadataFields(bytes memory metadataBytes) internal pure returns (bool) {
        if (!PostHelpers.validateMetadataFormat(metadataBytes)) {
            return false;
        }

        if (PostHelpers.hasEmptyValue(metadataBytes, "\"title\"") || 
            PostHelpers.hasEmptyValue(metadataBytes, "\"content\"")) {
            return false;
        }

        return true;
    }

    function validatePostMetadata(string memory metadata, IPostMinter.PostType postType) internal pure returns (bool) {
        bytes memory metadataBytes = bytes(metadata);
        return validateMetadataFields(metadataBytes) && validatePostType(metadataBytes, postType);
    }
} 