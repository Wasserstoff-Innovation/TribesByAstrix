// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * TribeController:
 * Manages tribes, including creation, updates, and member management.
 */
contract TribeController {
    uint256 public nextTribeId;

    enum JoinType { PUBLIC, PRIVATE, INVITE_ONLY }
    enum MemberStatus { PENDING, ACTIVE, BANNED }

    struct TribeConfig {
        JoinType joinType;
        uint256 entryFee;
        address collectibleRequirement;
    }

    struct Tribe {
        string name;
        string metadata;
        address admin;
        address[] whitelist;
        TribeConfig config;
    }

    mapping(uint256 => Tribe) public tribes;
    mapping(uint256 => mapping(address => MemberStatus)) public memberStatus;

    event TribeCreated(
        uint256 indexed tribeId,
        address indexed creator,
        string tribeName,
        JoinType joinType
    );
    event TribeUpdated(uint256 indexed tribeId, string newMetadata);
    event TribeConfigUpdated(
        uint256 indexed tribeId,
        JoinType joinType,
        uint256 entryFee,
        address collectibleRequirement
    );
    event MemberJoined(uint256 indexed tribeId, address indexed member);
    event JoinRequested(uint256 indexed tribeId, address indexed requester);
    event MembershipUpdated(uint256 indexed tribeId, address indexed member, MemberStatus status);

    function createTribe(
        string calldata tribeName,
        string calldata tribeMetadata,
        address[] calldata whitelist,
        JoinType joinType,
        uint256 entryFee,
        address collectibleRequirement
    ) external returns (uint256) {
        uint256 tribeId = nextTribeId++;
        
        tribes[tribeId] = Tribe({
            name: tribeName,
            metadata: tribeMetadata,
            admin: msg.sender,
            whitelist: whitelist,
            config: TribeConfig({
                joinType: joinType,
                entryFee: entryFee,
                collectibleRequirement: collectibleRequirement
            })
        });

        // Auto-add creator as active member
        memberStatus[tribeId][msg.sender] = MemberStatus.ACTIVE;

        emit TribeCreated(tribeId, msg.sender, tribeName, joinType);
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

    function updateTribeJoiningCriteria(
        uint256 tribeId,
        JoinType joinType,
        uint256 entryFee,
        address collectibleRequirement
    ) external {
        require(tribes[tribeId].admin == msg.sender, "Not tribe admin");

        tribes[tribeId].config = TribeConfig({
            joinType: joinType,
            entryFee: entryFee,
            collectibleRequirement: collectibleRequirement
        });

        emit TribeConfigUpdated(tribeId, joinType, entryFee, collectibleRequirement);
    }

    function joinTribe(uint256 tribeId) external {
        require(tribes[tribeId].config.joinType == JoinType.PUBLIC, "Tribe is not public");
        require(memberStatus[tribeId][msg.sender] != MemberStatus.BANNED, "User is banned");
        require(memberStatus[tribeId][msg.sender] != MemberStatus.ACTIVE, "Already a member");

        memberStatus[tribeId][msg.sender] = MemberStatus.ACTIVE;
        emit MemberJoined(tribeId, msg.sender);
    }

    function requestToJoinTribe(uint256 tribeId) external payable {
        require(tribes[tribeId].config.joinType != JoinType.PUBLIC, "Use joinTribe for public tribes");
        require(memberStatus[tribeId][msg.sender] != MemberStatus.BANNED, "User is banned");
        require(memberStatus[tribeId][msg.sender] != MemberStatus.ACTIVE, "Already a member");
        require(msg.value >= tribes[tribeId].config.entryFee, "Insufficient entry fee");

        // If there's a collectible requirement, check if user has it
        if (tribes[tribeId].config.collectibleRequirement != address(0)) {
            // TODO: Add collectible check logic
            revert("Collectible verification not implemented");
        }

        memberStatus[tribeId][msg.sender] = MemberStatus.PENDING;
        emit JoinRequested(tribeId, msg.sender);
    }

    function approveMember(uint256 tribeId, address member) external {
        require(tribes[tribeId].admin == msg.sender, "Not tribe admin");
        require(memberStatus[tribeId][member] == MemberStatus.PENDING, "Member not pending");

        memberStatus[tribeId][member] = MemberStatus.ACTIVE;
        emit MembershipUpdated(tribeId, member, MemberStatus.ACTIVE);
    }

    function rejectMember(uint256 tribeId, address member) external {
        require(tribes[tribeId].admin == msg.sender, "Not tribe admin");
        require(memberStatus[tribeId][member] == MemberStatus.PENDING, "Member not pending");

        // Return entry fee if applicable
        if (tribes[tribeId].config.entryFee > 0) {
            payable(member).transfer(tribes[tribeId].config.entryFee);
        }

        memberStatus[tribeId][member] = MemberStatus.BANNED;
        emit MembershipUpdated(tribeId, member, MemberStatus.BANNED);
    }

    function banMember(uint256 tribeId, address member) external {
        require(tribes[tribeId].admin == msg.sender, "Not tribe admin");
        require(memberStatus[tribeId][member] == MemberStatus.ACTIVE, "Member not active");

        memberStatus[tribeId][member] = MemberStatus.BANNED;
        emit MembershipUpdated(tribeId, member, MemberStatus.BANNED);
    }

    // Existing view functions
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

    function getMemberStatus(uint256 tribeId, address member) external view returns (MemberStatus) {
        return memberStatus[tribeId][member];
    }

    function getTribeConfig(uint256 tribeId) external view returns (TribeConfig memory) {
        return tribes[tribeId].config;
    }
} 