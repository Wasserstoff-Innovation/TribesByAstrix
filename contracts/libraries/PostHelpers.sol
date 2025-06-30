// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PostErrors.sol";

library PostHelpers {
    function validateMetadataFormat(bytes memory metadataBytes) internal pure returns (bool) {
        if (metadataBytes.length == 0) revert PostErrors.EmptyMetadata();
        if (metadataBytes[0] != "{" || metadataBytes[metadataBytes.length - 1] != "}") revert PostErrors.InvalidJsonFormat();
        return true;
    }

    function containsField(bytes memory json, string memory field) internal pure returns (bool) {
        bytes memory fieldBytes = bytes(field);
        bytes memory jsonBytes = json;
        
        if (jsonBytes.length < fieldBytes.length) return false;
        
        for (uint i = 0; i < jsonBytes.length - fieldBytes.length; i++) {
            bool found = true;
            for (uint j = 0; j < fieldBytes.length; j++) {
                if (jsonBytes[i + j] != fieldBytes[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return true;
        }
        return false;
    }

    function hasEmptyValue(bytes memory json, string memory field) internal pure returns (bool) {
        bytes memory fieldBytes = bytes(field);
        bytes memory jsonBytes = json;
        
        for (uint i = 0; i < jsonBytes.length - fieldBytes.length; i++) {
            bool foundField = true;
            for (uint j = 0; j < fieldBytes.length; j++) {
                if (jsonBytes[i + j] != fieldBytes[j]) {
                    foundField = false;
                    break;
                }
            }
            if (foundField) {
                uint256 pos = i + fieldBytes.length;
                while (pos < jsonBytes.length && (
                    jsonBytes[pos] == ' ' || 
                    jsonBytes[pos] == ':' || 
                    jsonBytes[pos] == '"'
                )) {
                    pos++;
                }
                if (pos < jsonBytes.length && jsonBytes[pos] == '"') {
                    pos++;
                    if (pos < jsonBytes.length && jsonBytes[pos] == '"') {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function validateRequiredFields(bytes memory json, string[] memory fields) internal pure returns (bool) {
        for (uint i = 0; i < fields.length; i++) {
            if (!containsField(json, fields[i])) {
                if (keccak256(bytes(fields[i])) == keccak256(bytes("\"title\""))) {
                    revert PostErrors.MissingTitleField();
                } else if (keccak256(bytes(fields[i])) == keccak256(bytes("\"content\""))) {
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
        bytes memory jsonBytes = json;
        
        for (uint i = 0; i < jsonBytes.length - fieldBytes.length; i++) {
            bool foundField = true;
            for (uint j = 0; j < fieldBytes.length; j++) {
                if (jsonBytes[i + j] != fieldBytes[j]) {
                    foundField = false;
                    break;
                }
            }
            if (foundField) {
                uint256 start = i + fieldBytes.length;
                // Skip whitespace and ":"
                while (start < jsonBytes.length && (
                    jsonBytes[start] == ' ' || 
                    jsonBytes[start] == ':' || 
                    jsonBytes[start] == '"'
                )) {
                    start++;
                }
                
                if (start >= jsonBytes.length) return "";
                
                uint256 end = start;
                // Find the end of the value
                while (end < jsonBytes.length && jsonBytes[end] != '"' && jsonBytes[end] != ',' && jsonBytes[end] != '}') {
                    end++;
                }
                
                // Extract the value
                bytes memory value = new bytes(end - start);
                for (uint j = 0; j < end - start; j++) {
                    value[j] = jsonBytes[start + j];
                }
                return string(value);
            }
        }
        return "";
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
} 