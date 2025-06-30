// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleManager.sol";
import "./TribeController.sol";

contract SuperCommunityController {
    RoleManager public roleManager;
    TribeController public tribeController;
    
    struct SuperCommunity {
        string name;
        string metadata;
        address admin;
        uint256[] memberTribeIds;
        bool active;
    }
    
    // superCommunityId => SuperCommunity
    mapping(uint256 => SuperCommunity) public superCommunities;
    // tribeId => superCommunityId
    mapping(uint256 => uint256) public tribeSuperCommunity;
    // tribeId => bool to track if tribe is in any super community
    mapping(uint256 => bool) public tribeInSuperCommunity;
    
    uint256 public nextSuperCommunityId;
    
    event SuperCommunityCreated(
        uint256 indexed superCommunityId,
        string name,
        address indexed admin
    );
    
    event TribeJoinedSuperCommunity(
        uint256 indexed superCommunityId,
        uint256 indexed tribeId
    );
    
    event TribeLeftSuperCommunity(
        uint256 indexed superCommunityId,
        uint256 indexed tribeId
    );
    
    constructor(address _roleManager, address _tribeController) {
        roleManager = RoleManager(_roleManager);
        tribeController = TribeController(_tribeController);
    }
    
    /**
     * @dev Creates a new super community
     */
    function createSuperCommunity(
        string calldata name,
        string calldata metadata,
        uint256[] calldata initialTribeIds
    ) external returns (uint256) {
        require(
            roleManager.hasRole(roleManager.ORGANIZER_ROLE(), msg.sender),
            "Not organizer"
        );
        
        uint256 superCommunityId = nextSuperCommunityId++;
        
        superCommunities[superCommunityId] = SuperCommunity({
            name: name,
            metadata: metadata,
            admin: msg.sender,
            memberTribeIds: initialTribeIds,
            active: true
        });
        
        // Link tribes to super community
        for (uint256 i = 0; i < initialTribeIds.length; i++) {
            require(!tribeInSuperCommunity[initialTribeIds[i]], "Tribe already in super community");
            tribeSuperCommunity[initialTribeIds[i]] = superCommunityId;
            tribeInSuperCommunity[initialTribeIds[i]] = true;
            emit TribeJoinedSuperCommunity(superCommunityId, initialTribeIds[i]);
        }
        
        emit SuperCommunityCreated(superCommunityId, name, msg.sender);
        return superCommunityId;
    }
    
    /**
     * @dev Adds a tribe to a super community
     */
    function addTribeToSuperCommunity(uint256 superCommunityId, uint256 tribeId) external {
        SuperCommunity storage superComm = superCommunities[superCommunityId];
        require(superComm.active, "Super community not active");
        require(superComm.admin == msg.sender, "Not admin");
        require(!tribeInSuperCommunity[tribeId], "Tribe already in super community");
        
        superComm.memberTribeIds.push(tribeId);
        tribeSuperCommunity[tribeId] = superCommunityId;
        tribeInSuperCommunity[tribeId] = true;
        
        emit TribeJoinedSuperCommunity(superCommunityId, tribeId);
    }
    
    /**
     * @dev Removes a tribe from a super community
     */
    function removeTribeFromSuperCommunity(uint256 superCommunityId, uint256 tribeId) external {
        SuperCommunity storage superComm = superCommunities[superCommunityId];
        require(superComm.active, "Super community not active");
        require(
            superComm.admin == msg.sender || 
            tribeController.getTribeAdmin(tribeId) == msg.sender,
            "Not authorized"
        );
        require(tribeSuperCommunity[tribeId] == superCommunityId, "Tribe not in this super community");
        
        // Remove tribe from array
        uint256[] storage tribes = superComm.memberTribeIds;
        for (uint256 i = 0; i < tribes.length; i++) {
            if (tribes[i] == tribeId) {
                tribes[i] = tribes[tribes.length - 1];
                tribes.pop();
                break;
            }
        }
        
        delete tribeSuperCommunity[tribeId];
        tribeInSuperCommunity[tribeId] = false;
        
        emit TribeLeftSuperCommunity(superCommunityId, tribeId);
    }
    
    /**
     * @dev Updates super community metadata
     */
    function updateSuperCommunityMetadata(
        uint256 superCommunityId,
        string calldata newName,
        string calldata newMetadata
    ) external {
        SuperCommunity storage superComm = superCommunities[superCommunityId];
        require(superComm.active, "Super community not active");
        require(superComm.admin == msg.sender, "Not admin");
        
        superComm.name = newName;
        superComm.metadata = newMetadata;
    }
    
    /**
     * @dev Gets all tribes in a super community
     */
    function getSuperCommunityTribes(uint256 superCommunityId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return superCommunities[superCommunityId].memberTribeIds;
    }
    
    /**
     * @dev Checks if an address is a member of any tribe in the super community
     */
    function isSuperCommunityMember(uint256 superCommunityId, address user) 
        external 
        view 
        returns (bool) 
    {
        uint256[] storage tribes = superCommunities[superCommunityId].memberTribeIds;
        for (uint256 i = 0; i < tribes.length; i++) {
            if (tribeController.isAddressWhitelisted(tribes[i], user)) {
                return true;
            }
        }
        return false;
    }
} 