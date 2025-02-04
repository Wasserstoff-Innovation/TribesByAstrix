// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * TribeController:
 * Manages tribes, including creation and updates.
 */
contract TribeController {
    uint256 public nextTribeId;

    struct Tribe {
        string name;
        string metadata;
        address admin;
        address[] whitelist;
    }

    mapping(uint256 => Tribe) public tribes;

    event TribeCreated(
        uint256 indexed tribeId,
        address indexed creator,
        string tribeName
    );
    event TribeUpdated(uint256 indexed tribeId, string newMetadata);

    function createTribe(
        string calldata tribeName,
        string calldata tribeMetadata,
        address[] calldata whitelist
    ) external returns (uint256) {
        uint256 tribeId = nextTribeId++;
        tribes[tribeId] = Tribe({
            name: tribeName,
            metadata: tribeMetadata,
            admin: msg.sender,
            whitelist: whitelist
        });

        emit TribeCreated(tribeId, msg.sender, tribeName);
        return tribeId;
    }

    function updateTribe(
        uint256 tribeId,
        string calldata newMetadata,
        address[] calldata updatedWhitelist
    ) external {
        require(tribes[tribeId].admin == msg.sender, "Not tribe admin");

        tribes[tribeId].metadata = newMetadata;
        tribes[tribeId].whitelist = updatedWhitelist;
        emit TribeUpdated(tribeId, newMetadata);
    }

    function getTribeAdmin(uint256 tribeId) external view returns (address) {
        return tribes[tribeId].admin;
    }

    function getTribeWhitelist(uint256 tribeId) external view returns (address[] memory) {
        return tribes[tribeId].whitelist;
    }

    function isAddressWhitelisted(uint256 tribeId, address user) external view returns (bool) {
        address[] memory whitelist = tribes[tribeId].whitelist;
        for (uint256 i = 0; i < whitelist.length; i++) {
            if (whitelist[i] == user) {
                return true;
            }
        }
        return false;
    }
} 