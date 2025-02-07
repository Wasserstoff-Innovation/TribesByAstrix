import { expect } from "chai";
import { ethers } from "hardhat";
import { TribeController, RoleManager, ContentManager, PointSystem } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("Community Creator Journey", function () {
  let tribeController: TribeController;
  let roleManager: RoleManager;
  let contentManager: ContentManager;
  let pointSystem: PointSystem;
  let owner: SignerWithAddress;
  let creator: SignerWithAddress;
  let moderator: SignerWithAddress;
  let users: SignerWithAddress[];
  let tribeId: number;

  beforeEach(async function () {
    [owner, creator, moderator, ...users] = await ethers.getSigners();

    // Deploy RoleManager
    const RoleManager = await ethers.getContractFactory("RoleManager");
    roleManager = await RoleManager.deploy();
    await roleManager.waitForDeployment();

    // Deploy TribeController
    const TribeController = await ethers.getContractFactory("TribeController");
    tribeController = await TribeController.deploy();
    await tribeController.waitForDeployment();

    // Deploy ContentManager
    const ContentManager = await ethers.getContractFactory("ContentManager");
    contentManager = await ContentManager.deploy(
      await roleManager.getAddress(),
      await tribeController.getAddress()
    );
    await contentManager.waitForDeployment();

    // Deploy PointSystem
    const PointSystem = await ethers.getContractFactory("PointSystem");
    pointSystem = await PointSystem.deploy(
      await roleManager.getAddress(),
      await tribeController.getAddress()
    );
    await pointSystem.waitForDeployment();

    // Grant creator role
    await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), creator.address);

    // Create a test tribe
    await tribeController.connect(creator).createTribe(
      "Test Community",
      "ipfs://metadata",
      [creator.address],
      0, // PUBLIC
      0,
      ethers.ZeroAddress
    );
    tribeId = 0;

    // Add users as members
    await tribeController.connect(users[0]).joinTribe(tribeId);
    await tribeController.connect(users[1]).joinTribe(tribeId);
  });

  describe("Scenario 9.1: Creating a Community", function () {
    it("Should create a public community with basic configuration", async function () {
      const tribeName = "Creator Community";
      const tribeMetadata = "ipfs://metadata";
      const joinType = 0; // PUBLIC
      const entryFee = 0;
      const collectibleRequirement = ethers.ZeroAddress;

      // Create community
      await expect(tribeController.connect(creator).createTribe(
        tribeName,
        tribeMetadata,
        [creator.address],
        joinType,
        entryFee,
        collectibleRequirement
      )).to.emit(tribeController, "TribeCreated")
        .withArgs(1, creator.address, tribeName, joinType);

      // Verify community configuration
      const tribeConfig = await tribeController.getTribeConfig(1);
      expect(tribeConfig.joinType).to.equal(joinType);
      expect(tribeConfig.entryFee).to.equal(entryFee);
      expect(tribeConfig.collectibleRequirement).to.equal(collectibleRequirement);

      // Verify creator is admin and active member
      expect(await tribeController.getTribeAdmin(1)).to.equal(creator.address);
      expect(await tribeController.getMemberStatus(1, creator.address)).to.equal(1); // ACTIVE
    });

    it("Should create a private community with entry fee", async function () {
      const tribeName = "Premium Community";
      const tribeMetadata = "ipfs://metadata";
      const joinType = 1; // PRIVATE
      const entryFee = ethers.parseEther("0.1");
      const collectibleRequirement = ethers.ZeroAddress;

      await expect(tribeController.connect(creator).createTribe(
        tribeName,
        tribeMetadata,
        [creator.address],
        joinType,
        entryFee,
        collectibleRequirement
      )).to.emit(tribeController, "TribeCreated");

      const tribeConfig = await tribeController.getTribeConfig(1);
      expect(tribeConfig.joinType).to.equal(joinType);
      expect(tribeConfig.entryFee).to.equal(entryFee);
    });

    it("Should create an invite-only community with collectible requirement", async function () {
      const tribeName = "Exclusive Community";
      const tribeMetadata = "ipfs://metadata";
      const joinType = 2; // INVITE_ONLY
      const entryFee = 0;
      const collectibleRequirement = "0x1234567890123456789012345678901234567890"; // Example NFT contract

      await expect(tribeController.connect(creator).createTribe(
        tribeName,
        tribeMetadata,
        [creator.address],
        joinType,
        entryFee,
        collectibleRequirement
      )).to.emit(tribeController, "TribeCreated");

      const tribeConfig = await tribeController.getTribeConfig(1);
      expect(tribeConfig.joinType).to.equal(joinType);
      expect(tribeConfig.collectibleRequirement).to.equal(collectibleRequirement);
    });
  });

  describe("Scenario 9.2: Managing Members & Engagement", function () {
    let privateTribeId: number;

    beforeEach(async function () {
      // Create a private test community
      await tribeController.connect(creator).createTribe(
        "Private Community",
        "ipfs://metadata",
        [creator.address],
        1, // PRIVATE
        ethers.parseEther("0.1"),
        ethers.ZeroAddress
      );
      privateTribeId = 1;
    });

    it("Should manage join requests and member roles", async function () {
      // User requests to join
      await expect(tribeController.connect(users[0]).requestToJoinTribe(privateTribeId, {
        value: ethers.parseEther("0.1")
      })).to.emit(tribeController, "JoinRequested");

      // Admin approves member
      await expect(tribeController.connect(creator).approveMember(privateTribeId, users[0].address))
        .to.emit(tribeController, "MembershipUpdated");

      // Assign moderator role
      await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), users[0].address);

      expect(await roleManager.hasRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), users[0].address))
        .to.be.true;
    });

    it("Should track member engagement and points", async function () {
      // Add user as member
      await tribeController.connect(users[0]).requestToJoinTribe(privateTribeId, {
        value: ethers.parseEther("0.1")
      });
      await tribeController.connect(creator).approveMember(privateTribeId, users[0].address);

      // Simulate engagement activities
      await pointSystem.connect(creator).awardPoints(privateTribeId, users[0].address, 5, ethers.keccak256(ethers.toUtf8Bytes("COMMENT")));
      await pointSystem.connect(creator).awardPoints(privateTribeId, users[0].address, 1, ethers.keccak256(ethers.toUtf8Bytes("LIKE")));

      const points = await pointSystem.getMemberPoints(privateTribeId, users[0].address);
      expect(points).to.equal(6); // 5 for comment + 1 for like
    });
  });

  describe("Scenario 9.3: Content Posting & Interaction", function () {
    it("Should create different types of posts", async function () {
      // Create text post
      const textPostTx = await contentManager.connect(creator).createPost(
        tribeId,
        "ipfs://text-post",
        0 // TEXT
      );
      const textPostReceipt = await textPostTx.wait();
      const textPostEvent = textPostReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
      const textPostId = textPostEvent ? textPostEvent.args[1] : 0;

      // Create media post
      const mediaPostTx = await contentManager.connect(creator).createPost(
        tribeId,
        "ipfs://media-post",
        1 // MEDIA
      );
      const mediaPostReceipt = await mediaPostTx.wait();
      const mediaPostEvent = mediaPostReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
      const mediaPostId = mediaPostEvent ? mediaPostEvent.args[1] : 0;

      // Create collectible announcement
      const announcementPostTx = await contentManager.connect(creator).createPost(
        tribeId,
        "ipfs://announcement",
        4 // COLLECTIBLE_ANNOUNCEMENT
      );
      const announcementPostReceipt = await announcementPostTx.wait();
      const announcementPostEvent = announcementPostReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
      const announcementPostId = announcementPostEvent ? announcementPostEvent.args[1] : 0;

      // Verify posts
      const textPost = await contentManager.getPost(tribeId, textPostId);
      expect(textPost.postType).to.equal(0);
      expect(textPost.contentURI).to.equal("ipfs://text-post");

      const mediaPost = await contentManager.getPost(tribeId, mediaPostId);
      expect(mediaPost.postType).to.equal(1);
      expect(mediaPost.contentURI).to.equal("ipfs://media-post");

      const announcementPost = await contentManager.getPost(tribeId, announcementPostId);
      expect(announcementPost.postType).to.equal(4);
      expect(announcementPost.contentURI).to.equal("ipfs://announcement");
    });

    it("Should allow members to interact with posts", async function () {
      // Create a post
      const postTx = await contentManager.connect(creator).createPost(
        tribeId,
        "ipfs://test-post",
        0 // TEXT
      );
      const postReceipt = await postTx.wait();
      const postEvent = postReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
      const postId = postEvent ? postEvent.args[1] : 0;

      // Award points for interactions
      await pointSystem.connect(creator).setActionPoints(tribeId, ethers.keccak256(ethers.toUtf8Bytes("LIKE")), 1);
      await pointSystem.connect(creator).setActionPoints(tribeId, ethers.keccak256(ethers.toUtf8Bytes("COMMENT")), 5);

      // Users interact with the post
      await pointSystem.connect(creator).recordAction(tribeId, users[0].address, ethers.keccak256(ethers.toUtf8Bytes("LIKE")));
      await pointSystem.connect(creator).recordAction(tribeId, users[0].address, ethers.keccak256(ethers.toUtf8Bytes("COMMENT")));

      // Verify points
      const points = await pointSystem.getMemberPoints(tribeId, users[0].address);
      expect(points).to.equal(6); // 1 for like + 5 for comment
    });
  });

  describe("Scenario 9.4: Poll & Quiz Management", function () {
    it("Should create and manage polls", async function () {
      const options = ["Option 1", "Option 2", "Option 3"];
      const duration = 86400; // 1 day

      // Create poll
      const pollTx = await contentManager.connect(creator).createPoll(
        tribeId,
        "ipfs://poll-content",
        options,
        duration
      );
      const pollReceipt = await pollTx.wait();
      const pollEvent = pollReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
      const pollId = pollEvent ? pollEvent.args[1] : 0;

      // Users vote
      await contentManager.connect(users[0]).submitPollVote(tribeId, pollId, 0);
      await contentManager.connect(users[1]).submitPollVote(tribeId, pollId, 1);

      // Verify votes
      expect(await contentManager.getPollVotes(pollId, 0)).to.equal(1);
      expect(await contentManager.getPollVotes(pollId, 1)).to.equal(1);
      expect(await contentManager.getPollVotes(pollId, 2)).to.equal(0);
    });

    it("Should create and manage quizzes", async function () {
      const questions = ["Q1", "Q2"];
      const answers = ["A1", "A2"];
      const answerHashes = answers.map(a => ethers.keccak256(ethers.toUtf8Bytes(a)));
      const pointsPerQuestion = 10;
      const duration = 86400; // 1 day

      // Create quiz
      const quizTx = await contentManager.connect(creator).createQuiz(
        tribeId,
        "ipfs://quiz-content",
        questions,
        answerHashes,
        pointsPerQuestion,
        duration
      );
      const quizReceipt = await quizTx.wait();
      const quizEvent = quizReceipt?.logs.find(x => x instanceof EventLog && x.eventName === "PostCreated") as EventLog;
      const quizId = quizEvent ? quizEvent.args[1] : 0;

      // User submits correct answers
      await contentManager.connect(users[0]).submitQuizAnswers(
        tribeId,
        quizId,
        answers
      );

      // Award points for quiz completion
      await pointSystem.connect(creator).awardPoints(
        tribeId,
        users[0].address,
        pointsPerQuestion * answers.length,
        ethers.keccak256(ethers.toUtf8Bytes("QUIZ"))
      );

      // Verify points
      const points = await pointSystem.getMemberPoints(tribeId, users[0].address);
      expect(points).to.equal(pointsPerQuestion * answers.length);
    });
  });
}); 
