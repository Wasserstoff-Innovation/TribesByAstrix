// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PostErrors.sol";

library PostHelpers {
    // Cache common field names to avoid repeated string comparisons
    bytes internal constant TITLE_FIELD = bytes("\"title\"");
    bytes internal constant CONTENT_FIELD = bytes("\"content\"");
    bytes internal constant TYPE_FIELD = bytes("\"type\"");
    
    function validateMetadataFormat(bytes memory metadataBytes) internal pure returns (bool) {
        // Quick validation to save gas - empty check and bracket check
        if (metadataBytes.length == 0) revert PostErrors.EmptyMetadata();
        if (metadataBytes[0] != "{" || metadataBytes[metadataBytes.length - 1] != "}") revert PostErrors.InvalidJsonFormat();
        return true;
    }

    function containsField(bytes memory json, string memory field) internal pure returns (bool) {
        bytes memory fieldBytes = bytes(field);
        
        // Early exit for efficiency
        if (json.length < fieldBytes.length) return false;
        
        // Use unchecked for gas optimization in the loop
        unchecked {
            for (uint i = 0; i < json.length - fieldBytes.length; i++) {
                bool found = true;
                for (uint j = 0; j < fieldBytes.length; j++) {
                    if (json[i + j] != fieldBytes[j]) {
                        found = false;
                        break;
                    }
                }
                if (found) return true;
            }
        }
        return false;
    }

    function hasEmptyValue(bytes memory json, string memory field) internal pure returns (bool) {
        bytes memory fieldBytes = bytes(field);
        
        // Early exit for efficiency
        if (json.length < fieldBytes.length) return false;
        
        // Use unchecked for gas optimization in the loop
        unchecked {
            for (uint i = 0; i < json.length - fieldBytes.length; i++) {
                bool foundField = true;
                for (uint j = 0; j < fieldBytes.length; j++) {
                    if (json[i + j] != fieldBytes[j]) {
                        foundField = false;
                        break;
                    }
                }
                
                if (foundField) {
                    // Found the field, now check if its value is empty
                    return _isValueEmpty(json, i + fieldBytes.length);
                }
            }
        }
        return false;
    }
    
    function _isValueEmpty(bytes memory json, uint256 pos) private pure returns (bool) {
        // Skip whitespace and field-value separators
        while (pos < json.length && (
            json[pos] == ' ' || 
            json[pos] == ':' || 
            json[pos] == '"'
        )) {
            pos++;
        }
        
        // Check for empty string value
        if (pos < json.length && json[pos] == '"') {
            pos++;
            if (pos < json.length && json[pos] == '"') {
                return true;
            }
        }
        return false;
    }

    function validateRequiredFields(bytes memory json, string[] memory fields) internal pure returns (bool) {
        for (uint i = 0; i < fields.length; i++) {
            if (!containsField(json, fields[i])) {
                // Check specific field requirements
                bytes32 fieldHash = keccak256(bytes(fields[i]));
                if (fieldHash == keccak256(TITLE_FIELD)) {
                    revert PostErrors.MissingTitleField();
                } else if (fieldHash == keccak256(CONTENT_FIELD)) {
                    revert PostErrors.MissingContentField();
                }
                revert PostErrors.EmptyField(fields[i]);
            }
            if (hasEmptyValue(json, fields[i])) {
                revert PostErrors.EmptyField(fields[i]);
            }
        }
        return true;
    }

    function extractField(bytes memory json, string memory field) internal pure returns (string memory) {
        bytes memory fieldBytes = bytes(field);
        
        // Early exit for efficiency
        if (json.length < fieldBytes.length) return "";
        
        unchecked {
            for (uint i = 0; i < json.length - fieldBytes.length; i++) {
                bool foundField = true;
                for (uint j = 0; j < fieldBytes.length; j++) {
                    if (json[i + j] != fieldBytes[j]) {
                        foundField = false;
                        break;
                    }
                }
                
                if (foundField) {
                    return _extractValue(json, i + fieldBytes.length);
                }
            }
        }
        return "";
    }
    
    function _extractValue(bytes memory json, uint256 start) private pure returns (string memory) {
        // Skip whitespace and field-value separators
        while (start < json.length && (
            json[start] == ' ' || 
            json[start] == ':' || 
            json[start] == '"'
        )) {
            start++;
        }
        
        if (start >= json.length) return "";
        
        uint256 end = start;
        // Find the end of the value
        while (end < json.length && json[end] != '"' && json[end] != ',' && json[end] != '}') {
            end++;
        }
        
        // Extract the value
        bytes memory value = new bytes(end - start);
        for (uint j = 0; j < end - start; j++) {
            value[j] = json[start + j];
        }
        return string(value);
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // Optimization: replacing string HEX conversion with direct byte operations
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        bytes memory hexChars = "0123456789abcdef";
        uint256 addr = uint160(x);
        
        unchecked {
            for (uint i = 39; i >= 0; i--) {
                s[i] = hexChars[addr & 0xf];
                addr >>= 4;
                if (i == 0) break;
            }
        }
        
        return string(s);
    }
} 