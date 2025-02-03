pragma solidity ^0.8.0;

interface ITribes {
    // Tribe structure
    struct Tribe {
        uint256 parentTribeId; // 0 for root tribes
        string name;
        //... other details like image, description, etc.
    }

    // Create a new tribe
    function createTribe(uint256 parentTribeId, string memory name) external;

    // Add a member to a tribe
    function addMember(uint256 tribeId, address member) external;

    // Example of a power/restriction function
    function setPollCreationPermission(
        uint256 tribeId,
        address nftContract,
        bool allowed
    ) external;

    //... other functions for managing tribes, powers, and restrictions
}