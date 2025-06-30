// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PostHelpers.sol";

library ProjectHelpers {
    function parseProjectPostId(bytes memory metadataBytes) internal pure returns (uint256) {
        bytes memory projectPostIdField = bytes("\"projectPostId\":");
        bytes memory originalPostIdField = bytes("\"originalPostId\":");
        
        // Try projectPostId first
        uint256 projectId = findAndParseId(metadataBytes, projectPostIdField);
        if (projectId != type(uint256).max) {
            return projectId;
        }
        
        // Try originalPostId if projectPostId not found
        return findAndParseId(metadataBytes, originalPostIdField);
    }

    function findAndParseId(bytes memory metadataBytes, bytes memory idField) internal pure returns (uint256) {
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

    function checkUserUpdatePermission(bytes memory originalMetadataBytes, address user) internal pure returns (bool) {
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
                bytes memory addressField = abi.encodePacked("\"address\":\"", PostHelpers.toAsciiString(user), "\"");
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
} 