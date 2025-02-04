import { expect } from "chai";
import { ethers } from "hardhat";
import { Voting } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Voting", function () {
  let voting: Voting;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  const TRIBE_ID = 1;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  describe("Journey 5.1: Create Proposal", function () {
    it("Should allow creating a proposal", async function () {
      const proposalDetails = "Test proposal details";

      const tx = await voting.connect(user1).createProposal(TRIBE_ID, proposalDetails);
      const receipt = await tx.wait();
      
      // Check event
      const event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(0), 32)); // indexed proposalId
      expect(event?.topics[2]).to.equal(ethers.zeroPadValue(ethers.toBeHex(TRIBE_ID), 32)); // indexed tribeId
      expect(event?.topics[3]).to.equal(ethers.zeroPadValue(user1.address, 32)); // indexed creator

      // Check proposal data
      const proposal = await voting.proposals(0);
      expect(proposal.tribeId).to.equal(TRIBE_ID);
      expect(proposal.details).to.equal(proposalDetails);
      expect(proposal.voteCount).to.equal(0);
    });

    it("Should increment proposalId after each creation", async function () {
      // Create first proposal
      await voting.connect(user1).createProposal(TRIBE_ID, "First proposal");

      // Create second proposal
      await voting.connect(user2).createProposal(TRIBE_ID, "Second proposal");

      expect(await voting.nextProposalId()).to.equal(2);
    });
  });

  describe("Journey 5.2: Vote on Proposal", function () {
    beforeEach(async function () {
      // Create a proposal for testing votes
      await voting.connect(user1).createProposal(TRIBE_ID, "Test proposal");
    });

    it("Should allow voting on proposal", async function () {
      const proposalId = 0;
      const voteChoice = true;

      const tx = await voting.connect(user2).vote(proposalId, voteChoice);
      const receipt = await tx.wait();
      
      // Check event
      const event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(proposalId), 32)); // indexed proposalId
      expect(event?.topics[2]).to.equal(ethers.zeroPadValue(user2.address, 32)); // indexed voter

      // Check vote count
      const proposal = await voting.proposals(proposalId);
      expect(proposal.voteCount).to.equal(1);
    });

    it("Should track vote counts correctly", async function () {
      const proposalId = 0;

      // First vote (true)
      await voting.connect(user1).vote(proposalId, true);
      let proposal = await voting.proposals(proposalId);
      expect(proposal.voteCount).to.equal(1);

      // Second vote (true)
      await voting.connect(user2).vote(proposalId, true);
      proposal = await voting.proposals(proposalId);
      expect(proposal.voteCount).to.equal(2);

      // Third vote (false - shouldn't increment count)
      await voting.connect(owner).vote(proposalId, false);
      proposal = await voting.proposals(proposalId);
      expect(proposal.voteCount).to.equal(2);
    });
  });

  describe("Journey 5.3: Unauthorized Vote Attempt", function () {
    // Note: Current implementation doesn't have authorization checks
    // These tests should be updated when authorization logic is added
    
    it("Should emit vote event regardless of vote choice", async function () {
      const proposalId = 0;
      await voting.connect(user1).createProposal(TRIBE_ID, "Test proposal");

      // Vote true
      let tx = await voting.connect(user2).vote(proposalId, true);
      let receipt = await tx.wait();
      let event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(proposalId), 32));
      expect(event?.topics[2]).to.equal(ethers.zeroPadValue(user2.address, 32));

      // Vote false
      tx = await voting.connect(user1).vote(proposalId, false);
      receipt = await tx.wait();
      event = receipt?.logs[0];
      expect(event?.topics[1]).to.equal(ethers.zeroPadValue(ethers.toBeHex(proposalId), 32));
      expect(event?.topics[2]).to.equal(ethers.zeroPadValue(user1.address, 32));
    });

    it("Should only count positive votes", async function () {
      const proposalId = 0;
      await voting.connect(user1).createProposal(TRIBE_ID, "Test proposal");

      // Multiple votes with different choices
      await voting.connect(user1).vote(proposalId, true);  // Count: 1
      await voting.connect(user2).vote(proposalId, false); // Count: 1
      await voting.connect(owner).vote(proposalId, true);  // Count: 2

      const proposal = await voting.proposals(proposalId);
      expect(proposal.voteCount).to.equal(2);
    });
  });
}); 