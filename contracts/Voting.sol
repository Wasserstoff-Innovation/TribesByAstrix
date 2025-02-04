// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    uint256 public nextProposalId;

    struct Proposal {
        uint256 tribeId;
        string details;
        uint256 voteCount;
    }
    
    mapping(uint256 => Proposal) public proposals;
    
    event ProposalCreated(uint256 indexed proposalId, uint256 indexed tribeId, address indexed creator, string proposalDetails);
    event VoteCasted(uint256 indexed proposalId, address indexed voter, bool voteChoice);

    function createProposal(uint256 tribeId, string calldata proposalDetails) external returns (uint256) {
        uint256 proposalId = nextProposalId++;
        proposals[proposalId] = Proposal({
            tribeId: tribeId,
            details: proposalDetails,
            voteCount: 0
        });
        emit ProposalCreated(proposalId, tribeId, msg.sender, proposalDetails);
        return proposalId;
    }

    function vote(uint256 proposalId, bool voteChoice) external {
        // Implement checks for voter eligibility if needed.
        if (voteChoice) {
            proposals[proposalId].voteCount += 1;
        }
        emit VoteCasted(proposalId, msg.sender, voteChoice);
    }
} 