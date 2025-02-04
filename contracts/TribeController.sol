// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TribeController {
    uint256 public nextTribeId;

    struct Tribe {
        string name;
        string metadata;
        address admin;
        address[] whitelist;
        mapping(address => bool) isWhitelisted;
    }
    
    mapping(uint256 => Tribe) public tribes;
    
    event TribeCreated(uint256 indexed tribeId, address indexed creator, string tribeName);
    event TribeUpdated(uint256 indexed tribeId, string newMetadata);
    event WhitelistUpdated(uint256 indexed tribeId, address[] whitelist);

    function createTribe(string calldata tribeName, string calldata tribeMetadata, address[] calldata whitelist) external returns (uint256) {
        uint256 tribeId = nextTribeId++;
        
        Tribe storage newTribe = tribes[tribeId];
        newTribe.name = tribeName;
        newTribe.metadata = tribeMetadata;
        newTribe.admin = msg.sender;
        
        // Initialize whitelist
        for (uint i = 0; i < whitelist.length; i++) {
            newTribe.whitelist.push(whitelist[i]);
            newTribe.isWhitelisted[whitelist[i]] = true;
        }

        emit TribeCreated(tribeId, msg.sender, tribeName);
        return tribeId;
    }

    function updateTribe(uint256 tribeId, string calldata newMetadata, address[] calldata updatedWhitelist) external {
        require(tribes[tribeId].admin == msg.sender, "Not tribe admin");

        tribes[tribeId].metadata = newMetadata;
        
        // Clear existing whitelist mappings
        for (uint i = 0; i < tribes[tribeId].whitelist.length; i++) {
            tribes[tribeId].isWhitelisted[tribes[tribeId].whitelist[i]] = false;
        }
        
        // Clear whitelist array
        delete tribes[tribeId].whitelist;
        
        // Add new whitelist
        for (uint i = 0; i < updatedWhitelist.length; i++) {
            tribes[tribeId].whitelist.push(updatedWhitelist[i]);
            tribes[tribeId].isWhitelisted[updatedWhitelist[i]] = true;
        }

        emit TribeUpdated(tribeId, newMetadata);
        emit WhitelistUpdated(tribeId, updatedWhitelist);
    }

    function isAddressWhitelisted(uint256 tribeId, address user) external view returns (bool) {
        return tribes[tribeId].isWhitelisted[user];
    }

    function getTribeWhitelist(uint256 tribeId) external view returns (address[] memory) {
        return tribes[tribeId].whitelist;
    }
} 