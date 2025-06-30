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
        } else if (postType == IPostMinter.PostType.RICH_MEDIA) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"RICH_MEDIA\"")) {
                return false;
            }
        } else if (postType == IPostMinter.PostType.PROJECT_UPDATE) {
            if (!PostHelpers.containsField(metadataBytes, "\"type\":\"PROJECT_UPDATE\"")) {
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