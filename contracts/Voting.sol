// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRoleManager.sol";
import "./interfaces/ITribeController.sol";

contract Voting {
    IRoleManager public roleManager;
    ITribeController public tribeController;
    
    uint256 public nextProposalId;

    enum ProposalStatus {
        ACTIVE,
        PASSED,
        REJECTED,
        CANCELED
    }

    struct Proposal {
        uint256 tribeId;
        address creator;
        string title;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    
    event ProposalCreated(
        uint256 indexed proposalId, 
        uint256 indexed tribeId, 
        address indexed creator, 
        string title,
        string description,
        uint256 startTime,
        uint256 endTime
    );
    event VoteCasted(uint256 indexed proposalId, address indexed voter, bool support);
    event ProposalStatusChanged(uint256 indexed proposalId, ProposalStatus newStatus);

    constructor(address _roleManager, address _tribeController) {
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
    }

    modifier onlyProposalCreator() {
        require(
            roleManager.hasRole(roleManager.PROPOSAL_CREATOR_ROLE(), msg.sender),
            "Not authorized to create proposals"
        );
        _;
    }

    modifier onlyTribeAdmin(uint256 tribeId) {
        require(tribeController.getTribeAdmin(tribeId) == msg.sender, "Not tribe admin");
        _;
    }

    modifier onlyTribeMember(uint256 tribeId) {
        require(
            tribeController.getMemberStatus(tribeId, msg.sender) == ITribeController.MemberStatus.ACTIVE,
            "Not an active member"
        );
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        require(proposals[proposalId].startTime > 0, "Proposal does not exist");
        _;
    }

    modifier proposalActive(uint256 proposalId) {
        require(proposals[proposalId].status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp >= proposals[proposalId].startTime, "Voting not started");
        require(block.timestamp <= proposals[proposalId].endTime, "Voting ended");
        _;
    }

    function createProposal(
        uint256 tribeId,
        string calldata title,
        string calldata description,
        uint256 votingPeriod
    ) external onlyProposalCreator returns (uint256) {
        // Either be a proposal creator with role or the tribe admin
        require(
            roleManager.hasRole(roleManager.PROPOSAL_CREATOR_ROLE(), msg.sender) || 
            tribeController.getTribeAdmin(tribeId) == msg.sender,
            "Not authorized to create proposals"
        );

        uint256 proposalId = nextProposalId++;
        Proposal storage newProposal = proposals[proposalId];
        
        newProposal.tribeId = tribeId;
        newProposal.creator = msg.sender;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingPeriod;
        newProposal.status = ProposalStatus.ACTIVE;
        
        emit ProposalCreated(
            proposalId, 
            tribeId, 
            msg.sender, 
            title, 
            description, 
            newProposal.startTime, 
            newProposal.endTime
        );
        
        return proposalId;
    }

    function vote(
        uint256 proposalId, 
        bool support
    ) external 
        proposalExists(proposalId) 
        proposalActive(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        
        // Must be a tribe member to vote
        require(
            tribeController.getMemberStatus(proposal.tribeId, msg.sender) == ITribeController.MemberStatus.ACTIVE,
            "Not a tribe member"
        );
        
        require(!proposal.hasVoted[msg.sender], "Already voted");
        
        if (support) {
            proposal.forVotes += 1;
        } else {
            proposal.againstVotes += 1;
        }
        
        proposal.hasVoted[msg.sender] = true;
        
        emit VoteCasted(proposalId, msg.sender, support);
    }
    
    function executeProposal(uint256 proposalId) external 
        proposalExists(proposalId)
        onlyTribeAdmin(proposals[proposalId].tribeId)
    {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        require(block.timestamp > proposal.endTime, "Voting period not over");
        
        if (proposal.forVotes > proposal.againstVotes) {
            proposal.status = ProposalStatus.PASSED;
        } else {
            proposal.status = ProposalStatus.REJECTED;
        }
        
        emit ProposalStatusChanged(proposalId, proposal.status);
    }
    
    function cancelProposal(uint256 proposalId) external 
        proposalExists(proposalId)
    {
        Proposal storage proposal = proposals[proposalId];
        
        // Only the creator or tribe admin can cancel
        require(
            proposal.creator == msg.sender || tribeController.getTribeAdmin(proposal.tribeId) == msg.sender,
            "Not authorized"
        );
        
        require(proposal.status == ProposalStatus.ACTIVE, "Proposal not active");
        
        proposal.status = ProposalStatus.CANCELED;
        emit ProposalStatusChanged(proposalId, ProposalStatus.CANCELED);
    }
    
    function getProposalInfo(uint256 proposalId) external view 
        proposalExists(proposalId)
        returns (
            uint256 tribeId,
            address creator,
            string memory title,
            string memory description,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 startTime,
            uint256 endTime,
            ProposalStatus status
        )
    {
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.tribeId,
            proposal.creator,
            proposal.title,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.status
        );
    }
    
    function hasVoted(uint256 proposalId, address voter) external view 
        proposalExists(proposalId)
        returns (bool)
    {
        return proposals[proposalId].hasVoted[voter];
    }
} 