// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ITribeController.sol";
import "./interfaces/IRoleManager.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * TribeController:
 * Manages tribes, including creation, updates, and member management.
 */
contract TribeController is ITribeController, Initializable {
    uint256 public nextTribeId;
    uint256 public nextMergeRequestId;

    struct TribeStorage {
        string name;
        string metadata;
        address admin;
        address[] whitelist;
        JoinType joinType;
        uint256 entryFee;
        NFTRequirement[] nftRequirements;
        mapping(bytes32 => InviteCode) inviteCodes;
        bool canMerge;
        bool isActive;
    }

    // Internal mappings
    mapping(uint256 => TribeStorage) private tribes;
    mapping(uint256 => mapping(address => MemberStatus)) private memberStatuses;
    mapping(uint256 => MergeRequest) private mergeRequests;
    mapping(uint256 => uint256) private memberCounts;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(bytes32 => bool)) public inviteCodes;

    IRoleManager public roleManager;

    constructor(address _roleManager) {
        roleManager = IRoleManager(_roleManager);
        nextTribeId = 0;
        nextMergeRequestId = 0;
    }

    modifier onlyTribeAdmin(uint256 tribeId) {
        require(
            (tribes[tribeId].admin == msg.sender || 
            roleManager.hasRole(keccak256(bytes("MODERATOR_ROLE")), msg.sender)) &&
            // Add check to ensure moderators aren't banned from the tribe they're trying to manage
            memberStatuses[tribeId][msg.sender] != MemberStatus.BANNED,
            "Not tribe admin"
        );
        _;
    }

    function createTribe(
        string calldata name,
        string calldata metadata,
        address[] calldata admins,
        JoinType joinType,
        uint256 entryFee,
        NFTRequirement[] calldata nftRequirements
    ) external returns (uint256) {
        uint256 tribeId = nextTribeId++;
        
        TribeStorage storage newTribe = tribes[tribeId];
        newTribe.name = name;
        newTribe.metadata = metadata;
        newTribe.admin = msg.sender;
        newTribe.whitelist = admins;
        newTribe.joinType = joinType;
        newTribe.entryFee = entryFee;
        
        // Manually copy NFTRequirements
        for (uint256 i = 0; i < nftRequirements.length; i++) {
            newTribe.nftRequirements.push(NFTRequirement({
                nftContract: nftRequirements[i].nftContract,
                nftType: nftRequirements[i].nftType,
                isMandatory: nftRequirements[i].isMandatory,
                minAmount: nftRequirements[i].minAmount,
                tokenIds: nftRequirements[i].tokenIds
            }));
        }
        
        newTribe.canMerge = true;
        newTribe.isActive = true;

        // Auto-add creator as active member
        memberStatuses[tribeId][msg.sender] = MemberStatus.ACTIVE;
        memberCounts[tribeId] = 1;

        emit TribeCreated(tribeId, msg.sender, name, joinType);
        return tribeId;
    }

    function updateTribe(
        uint256 tribeId,
        string calldata newMetadata,
        address[] calldata updatedWhitelist
    ) external onlyTribeAdmin(tribeId) {
        tribes[tribeId].metadata = newMetadata;
        tribes[tribeId].whitelist = updatedWhitelist;
        emit TribeConfigUpdated(tribeId, tribes[tribeId].joinType, tribes[tribeId].entryFee);
    }

    function updateTribeConfig(
        uint256 tribeId,
        JoinType joinType,
        uint256 entryFee,
        NFTRequirement[] calldata nftRequirements
    ) external onlyTribeAdmin(tribeId) {
        TribeStorage storage tribe = tribes[tribeId];
        tribe.joinType = joinType;
        tribe.entryFee = entryFee;
        
        // Clear existing requirements and copy new ones
        delete tribe.nftRequirements;
        for (uint256 i = 0; i < nftRequirements.length; i++) {
            tribe.nftRequirements.push(NFTRequirement({
                nftContract: nftRequirements[i].nftContract,
                nftType: nftRequirements[i].nftType,
                isMandatory: nftRequirements[i].isMandatory,
                minAmount: nftRequirements[i].minAmount,
                tokenIds: nftRequirements[i].tokenIds
            }));
        }

        emit TribeConfigUpdated(tribeId, joinType, entryFee);
    }

    function joinTribe(uint256 tribeId) external {
        require(tribeId < nextTribeId, "Invalid tribe ID");
        require(!isMember[tribeId][msg.sender], "Already a member");
        require(memberStatuses[tribeId][msg.sender] != MemberStatus.BANNED, "User is banned");
        
        TribeStorage storage tribe = tribes[tribeId];
        require(tribe.isActive, "Tribe not active");
        require(
            tribe.joinType == JoinType.PUBLIC || 
            (tribe.joinType != JoinType.PRIVATE && tribe.joinType != JoinType.INVITE_CODE),
            "Tribe not public or requires invite code"
        );
        
        if (tribe.joinType == JoinType.NFT_GATED || 
            tribe.joinType == JoinType.MULTI_NFT || 
            tribe.joinType == JoinType.ANY_NFT) {
            require(_validateNFTRequirements(tribeId, msg.sender), "NFT requirements not met");
        }
        
        memberStatuses[tribeId][msg.sender] = MemberStatus.ACTIVE;
        isMember[tribeId][msg.sender] = true;
        memberCounts[tribeId]++;
        tribe.whitelist.push(msg.sender);
        
        emit MemberJoined(tribeId, msg.sender);
        emit MembershipUpdated(tribeId, msg.sender, MemberStatus.ACTIVE);
    }

    function requestToJoinTribe(uint256 tribeId) external payable {
        TribeStorage storage tribe = tribes[tribeId];
        require(tribe.isActive, "Tribe not active");
        require(tribe.joinType != JoinType.PUBLIC, "Use joinTribe for public tribes");
        require(memberStatuses[tribeId][msg.sender] != MemberStatus.BANNED, "User is banned");
        require(memberStatuses[tribeId][msg.sender] != MemberStatus.ACTIVE, "Already a member");
        require(msg.value >= tribe.entryFee, "Insufficient entry fee");

        memberStatuses[tribeId][msg.sender] = MemberStatus.PENDING;
        emit MembershipUpdated(tribeId, msg.sender, MemberStatus.PENDING);
    }

    function approveMember(uint256 tribeId, address member) external onlyTribeAdmin(tribeId) {
        require(memberStatuses[tribeId][member] == MemberStatus.PENDING, "Member not pending");
        memberStatuses[tribeId][member] = MemberStatus.ACTIVE;
        isMember[tribeId][member] = true;
        memberCounts[tribeId]++;
        tribes[tribeId].whitelist.push(member);
        emit MembershipUpdated(tribeId, member, MemberStatus.ACTIVE);
    }

    function rejectMember(uint256 tribeId, address member) external onlyTribeAdmin(tribeId) {
        require(memberStatuses[tribeId][member] == MemberStatus.PENDING, "Member not pending");
        delete memberStatuses[tribeId][member]; // This effectively sets it to the first enum value (NONE)
        
        // Return entry fee if applicable
        uint256 entryFee = tribes[tribeId].entryFee;
        if (entryFee > 0) {
            payable(member).transfer(entryFee);
        }
        
        emit MembershipUpdated(tribeId, member, MemberStatus.NONE);
    }

    function banMember(uint256 tribeId, address member) external onlyTribeAdmin(tribeId) {
        require(memberStatuses[tribeId][member] == MemberStatus.ACTIVE, "Member not active");
        memberStatuses[tribeId][member] = MemberStatus.BANNED;
        memberCounts[tribeId]--;
        emit MembershipUpdated(tribeId, member, MemberStatus.BANNED);
    }

    function joinTribeWithCode(uint256 tribeId, bytes32 inviteCode) external {
        require(tribeId < nextTribeId, "Invalid tribe ID");
        require(!isMember[tribeId][msg.sender], "Already a member");
        require(memberStatuses[tribeId][msg.sender] != MemberStatus.BANNED, "User is banned");
        
        TribeStorage storage tribe = tribes[tribeId];
        require(tribe.isActive, "Tribe not active");
        require(
            tribe.joinType == JoinType.INVITE_CODE,
            "Tribe does not use invite codes"
        );
        
        InviteCode storage invite = tribe.inviteCodes[inviteCode];
        require(invite.codeHash == inviteCode, "Invalid invite code");
        
        // Check expiry first
        if (invite.expiryTime > 0) {
            require(block.timestamp <= invite.expiryTime, "Invite code expired");
        }
        
        // Then check usage limit
        require(invite.maxUses > invite.usedCount, "Invite code fully used");
        
        invite.usedCount++;
        memberStatuses[tribeId][msg.sender] = MemberStatus.ACTIVE;
        isMember[tribeId][msg.sender] = true;
        memberCounts[tribeId]++;
        
        emit MemberJoined(tribeId, msg.sender);
        emit MembershipUpdated(tribeId, msg.sender, MemberStatus.ACTIVE);
    }

    function createInviteCode(
        uint256 tribeId,
        string calldata code,
        uint256 maxUses,
        uint256 expiryTime
    ) external onlyTribeAdmin(tribeId) {
        require(tribes[tribeId].joinType == JoinType.INVITE_CODE, "Tribe does not use invite codes");
        require(maxUses > 0, "Invalid max uses");
        require(expiryTime == 0 || expiryTime > block.timestamp, "Invalid expiry time");
        
        bytes32 codeHash = keccak256(abi.encodePacked(code));
        require(tribes[tribeId].inviteCodes[codeHash].codeHash == bytes32(0), "Code already exists");

        tribes[tribeId].inviteCodes[codeHash] = InviteCode({
            codeHash: codeHash,
            maxUses: maxUses,
            usedCount: 0,
            expiryTime: expiryTime
        });

        emit InviteCodeCreated(tribeId, codeHash, maxUses, expiryTime);
    }

    function requestMerge(uint256 sourceTribeId, uint256 targetTribeId) external onlyTribeAdmin(sourceTribeId) {
        require(tribes[sourceTribeId].isActive && tribes[targetTribeId].isActive, "Tribes must be active");
        require(tribes[sourceTribeId].canMerge, "Source tribe cannot be merged");
        
        uint256 requestId = nextMergeRequestId++;
        mergeRequests[requestId] = MergeRequest({
            sourceTribeId: sourceTribeId,
            targetTribeId: targetTribeId,
            requestTime: block.timestamp,
            approved: false
        });

        emit MergeRequested(requestId, sourceTribeId, targetTribeId);
    }

    function approveMerge(uint256 mergeRequestId) external {
        MergeRequest storage request = mergeRequests[mergeRequestId];
        require(tribes[request.targetTribeId].admin == msg.sender, "Not target tribe admin");
        require(!request.approved, "Already approved");

        request.approved = true;
        emit MergeApproved(mergeRequestId);
    }

    function executeMerge(uint256 mergeRequestId) external {
        MergeRequest storage request = mergeRequests[mergeRequestId];
        require(request.approved, "Merge not approved");
        
        uint256 sourceTribeId = request.sourceTribeId;
        uint256 targetTribeId = request.targetTribeId;

        // Transfer all members from source to target
        for (uint256 i = 0; i < tribes[sourceTribeId].whitelist.length; i++) {
            address member = tribes[sourceTribeId].whitelist[i];
            if (memberStatuses[sourceTribeId][member] == MemberStatus.ACTIVE) {
                memberStatuses[targetTribeId][member] = MemberStatus.ACTIVE;
                emit MembershipUpdated(targetTribeId, member, MemberStatus.ACTIVE);
            }
        }

        // Update member count
        memberCounts[targetTribeId] += memberCounts[sourceTribeId];

        // Deactivate source tribe
        tribes[sourceTribeId].isActive = false;

        emit MergeExecuted(mergeRequestId, sourceTribeId, targetTribeId);
    }

    function _validateNFTRequirements(uint256 tribeId, address user) internal view returns (bool) {
        // If the user is already an active member, they are grandfathered in
        // This allows existing members to retain access when a tribe changes its gating requirements
        if (isMember[tribeId][user] && memberStatuses[tribeId][user] == MemberStatus.ACTIVE) {
            return true;
        }
        
        NFTRequirement[] memory requirements = tribes[tribeId].nftRequirements;
        if (requirements.length == 0) return true;

        JoinType joinType = tribes[tribeId].joinType;
        if (joinType == JoinType.MULTI_NFT) {
            // All mandatory NFTs must be held
            for (uint i = 0; i < requirements.length; i++) {
                if (requirements[i].isMandatory && !_validateSingleNFTRequirement(requirements[i], user)) {
                    return false;
                }
            }
            return true;
        } else if (joinType == JoinType.ANY_NFT) {
            // At least one NFT must be held
            for (uint i = 0; i < requirements.length; i++) {
                if (_validateSingleNFTRequirement(requirements[i], user)) {
                    return true;
                }
            }
            return false;
        } else {
            // NFT_GATED - Default behavior, all NFTs must be held
            for (uint i = 0; i < requirements.length; i++) {
                if (!_validateSingleNFTRequirement(requirements[i], user)) {
                    return false;
                }
            }
            return true;
        }
    }

    function _validateSingleNFTRequirement(NFTRequirement memory req, address user) internal view returns (bool) {
        if (req.nftContract == address(0)) return false;
        
        if (req.nftType == NFTType.ERC721) {
            try IERC721(req.nftContract).balanceOf(user) returns (uint256 balance) {
                if (balance < req.minAmount) return false;
                if (req.tokenIds.length == 0) return true; // If no specific tokens required, just check balance
                
                // Check specific token IDs if specified
                for (uint i = 0; i < req.tokenIds.length; i++) {
                    try IERC721(req.nftContract).ownerOf(req.tokenIds[i]) returns (address owner) {
                        if (owner != user) return false;
                    } catch {
                        return false;
                    }
                }
                return true;
            } catch {
                return false;
            }
        } else if (req.nftType == NFTType.ERC1155) {
            if (req.tokenIds.length == 0) return false; // ERC1155 must specify token IDs
            
            for (uint i = 0; i < req.tokenIds.length; i++) {
                try IERC1155(req.nftContract).balanceOf(user, req.tokenIds[i]) returns (uint256 balance) {
                    if (balance < req.minAmount) return false;
                } catch {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    function revokeInviteCode(uint256 tribeId, string calldata code) external onlyTribeAdmin(tribeId) {
        require(tribes[tribeId].joinType == JoinType.INVITE_CODE, "Tribe does not use invite codes");
        bytes32 codeHash = keccak256(abi.encodePacked(code));
        require(tribes[tribeId].inviteCodes[codeHash].codeHash == codeHash, "Code does not exist");
        delete tribes[tribeId].inviteCodes[codeHash];
        emit InviteCodeRevoked(tribeId, codeHash);
    }

    function cancelMerge(uint256 mergeRequestId) external {
        MergeRequest storage request = mergeRequests[mergeRequestId];
        require(!request.approved, "Merge already approved");
        require(
            msg.sender == tribes[request.sourceTribeId].admin || 
            msg.sender == tribes[request.targetTribeId].admin,
            "Not authorized"
        );
        delete mergeRequests[mergeRequestId];
        emit MergeCancelled(mergeRequestId);
    }

    function getMergeRequest(uint256 requestId) external view returns (MergeRequest memory) {
        return mergeRequests[requestId];
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
        return memberStatuses[tribeId][member];
    }

    function getTribeConfigView(uint256 tribeId) external view returns (TribeConfigView memory) {
        TribeStorage storage tribe = tribes[tribeId];
        NFTRequirement[] memory requirements = new NFTRequirement[](tribe.nftRequirements.length);
        for (uint i = 0; i < tribe.nftRequirements.length; i++) {
            requirements[i] = tribe.nftRequirements[i];
        }
        return TribeConfigView({
            joinType: tribe.joinType,
            entryFee: tribe.entryFee,
            nftRequirements: requirements,
            canMerge: tribe.canMerge
        });
    }

    function getMemberCount(uint256 tribeId) external view returns (uint256) {
        return memberCounts[tribeId];
    }

    function getUserTribes(address user) external view returns (uint256[] memory tribeIds) {
        // First, count how many tribes the user is a member of
        uint256 count = 0;
        for (uint256 i = 0; i < nextTribeId; i++) {
            if (memberStatuses[i][user] == MemberStatus.ACTIVE) {
                count++;
            }
        }

        // Create array of appropriate size
        tribeIds = new uint256[](count);
        
        // Fill array with tribe IDs
        uint256 index = 0;
        for (uint256 i = 0; i < nextTribeId; i++) {
            if (memberStatuses[i][user] == MemberStatus.ACTIVE) {
                tribeIds[index] = i;
                index++;
            }
        }

        return tribeIds;
    }

    function getInviteCodeStatus(uint256 tribeId, string calldata code) 
        external 
        view
        returns (bool valid, uint256 remainingUses) 
    {
        require(tribes[tribeId].joinType == JoinType.INVITE_CODE, "Tribe does not use invite codes");
        bytes32 codeHash = keccak256(abi.encodePacked(code));
        InviteCode storage invite = tribes[tribeId].inviteCodes[codeHash];
        
        if (invite.codeHash != codeHash) return (false, 0);
        if (invite.expiryTime != 0 && invite.expiryTime <= block.timestamp) return (false, 0);
        if (invite.usedCount >= invite.maxUses) return (false, 0);
        
        return (true, invite.maxUses - invite.usedCount);
    }

    // New functions for tribe listing and details
    
    /**
     * @dev Returns the total number of tribes that have been created.
     * @return The total number of tribes.
     */
    function getTotalTribesCount() external view returns (uint256) {
        return nextTribeId;
    }
    
    /**
     * @dev Gets a paginated list of all tribe IDs.
     * @param offset The starting index for pagination.
     * @param limit The maximum number of tribes to return.
     * @return A struct containing tribe IDs and total count.
     */
    function getAllTribes(uint256 offset, uint256 limit) external view returns (PaginatedTribes memory) {
        uint256 total = nextTribeId;
        
        // Check if offset is valid
        if (offset >= total) {
            return PaginatedTribes({
                tribeIds: new uint256[](0),
                total: total
            });
        }
        
        // Calculate actual number of tribes to return
        uint256 count = (offset + limit > total) ? (total - offset) : limit;
        uint256[] memory tribeIds = new uint256[](count);
        
        // Populate the array with tribe IDs
        for (uint256 i = 0; i < count; i++) {
            tribeIds[i] = offset + i;
        }
        
        return PaginatedTribes({
            tribeIds: tribeIds,
            total: total
        });
    }
    
    /**
     * @dev Gets comprehensive details about a specific tribe.
     * @param tribeId The ID of the tribe to get details for.
     * @return A struct containing detailed information about the tribe.
     */
    function getTribeDetails(uint256 tribeId) external view returns (TribeDetails memory) {
        require(tribeId < nextTribeId, "Invalid tribe ID");
        
        TribeStorage storage tribe = tribes[tribeId];
        
        return TribeDetails({
            id: tribeId,
            name: tribe.name,
            metadata: tribe.metadata,
            admin: tribe.admin,
            joinType: tribe.joinType,
            entryFee: tribe.entryFee,
            memberCount: memberCounts[tribeId],
            isActive: tribe.isActive,
            canMerge: tribe.canMerge
        });
    }
} 