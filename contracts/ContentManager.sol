// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IRoleManager.sol";
import "./interfaces/ITribeController.sol";

contract ContentManager is AccessControl {
    IRoleManager public roleManager;
    ITribeController public tribeController;

    struct Post {
        address author;
        string contentURI;
        uint256 timestamp;
        bool isActive;
        PostType postType;
    }

    enum PostType {
        TEXT,
        MEDIA,
        POLL,
        QUIZ,
        COLLECTIBLE_ANNOUNCEMENT
    }

    struct Poll {
        string[] options;
        mapping(uint256 => uint256) votes; // option index => vote count
        uint256 endTime;
        bool isActive;
    }

    struct Quiz {
        string[] questions;
        bytes32[] answerHashes; // hashed correct answers
        uint256 pointsPerQuestion;
        uint256 endTime;
        bool isActive;
    }

    // Tribe ID => Post ID => Post
    mapping(uint256 => mapping(uint256 => Post)) public posts;
    // Tribe ID => Post count
    mapping(uint256 => uint256) public postCount;
    // Post ID => Poll
    mapping(uint256 => Poll) public polls;
    // Post ID => Quiz
    mapping(uint256 => Quiz) public quizzes;

    event PostCreated(uint256 indexed tribeId, uint256 indexed postId, address author, PostType postType);
    event PostDeleted(uint256 indexed tribeId, uint256 indexed postId);
    event PollVoteSubmitted(uint256 indexed postId, address voter, uint256 optionIndex);
    event QuizAnswerSubmitted(uint256 indexed postId, address participant, uint256 score);

    constructor(address _roleManager, address _tribeController) {
        roleManager = IRoleManager(_roleManager);
        tribeController = ITribeController(_tribeController);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyTribeMember(uint256 tribeId) {
        require(tribeController.getMemberStatus(tribeId, msg.sender) == ITribeController.MemberStatus.ACTIVE, "Not an active member");
        _;
    }

    modifier onlyTribeAdmin(uint256 tribeId) {
        require(tribeController.getTribeAdmin(tribeId) == msg.sender, "Not tribe admin");
        _;
    }

    function _createPost(
        uint256 tribeId,
        string memory contentURI,
        PostType postType
    ) internal returns (uint256) {
        uint256 postId = postCount[tribeId];
        posts[tribeId][postId] = Post({
            author: msg.sender,
            contentURI: contentURI,
            timestamp: block.timestamp,
            isActive: true,
            postType: postType
        });

        postCount[tribeId]++;
        emit PostCreated(tribeId, postId, msg.sender, postType);
        return postId;
    }

    function createPost(
        uint256 tribeId,
        string memory contentURI,
        PostType postType
    ) external onlyTribeMember(tribeId) returns (uint256) {
        return _createPost(tribeId, contentURI, postType);
    }

    function createPoll(
        uint256 tribeId,
        string memory contentURI,
        string[] memory options,
        uint256 duration
    ) external onlyTribeMember(tribeId) returns (uint256) {
        uint256 postId = _createPost(tribeId, contentURI, PostType.POLL);
        
        Poll storage newPoll = polls[postId];
        newPoll.options = options;
        newPoll.endTime = block.timestamp + duration;
        newPoll.isActive = true;

        return postId;
    }

    function createQuiz(
        uint256 tribeId,
        string memory contentURI,
        string[] memory questions,
        bytes32[] memory answerHashes,
        uint256 pointsPerQuestion,
        uint256 duration
    ) external onlyTribeMember(tribeId) returns (uint256) {
        require(questions.length == answerHashes.length, "Questions and answers mismatch");
        
        uint256 postId = _createPost(tribeId, contentURI, PostType.QUIZ);
        
        Quiz storage newQuiz = quizzes[postId];
        newQuiz.questions = questions;
        newQuiz.answerHashes = answerHashes;
        newQuiz.pointsPerQuestion = pointsPerQuestion;
        newQuiz.endTime = block.timestamp + duration;
        newQuiz.isActive = true;

        return postId;
    }

    function submitPollVote(
        uint256 tribeId,
        uint256 postId,
        uint256 optionIndex
    ) external onlyTribeMember(tribeId) {
        Poll storage poll = polls[postId];
        require(poll.isActive && block.timestamp < poll.endTime, "Poll is not active");
        require(optionIndex < poll.options.length, "Invalid option");

        poll.votes[optionIndex]++;
        emit PollVoteSubmitted(postId, msg.sender, optionIndex);
    }

    function submitQuizAnswers(
        uint256 tribeId,
        uint256 postId,
        string[] memory answers
    ) external onlyTribeMember(tribeId) {
        Quiz storage quiz = quizzes[postId];
        require(quiz.isActive && block.timestamp < quiz.endTime, "Quiz is not active");
        require(answers.length == quiz.questions.length, "Invalid number of answers");

        uint256 score = 0;
        for (uint256 i = 0; i < answers.length; i++) {
            if (keccak256(abi.encodePacked(answers[i])) == quiz.answerHashes[i]) {
                score += quiz.pointsPerQuestion;
            }
        }

        emit QuizAnswerSubmitted(postId, msg.sender, score);
    }

    function deletePost(
        uint256 tribeId,
        uint256 postId
    ) external onlyTribeAdmin(tribeId) {
        require(posts[tribeId][postId].isActive, "Post already deleted");
        posts[tribeId][postId].isActive = false;
        
        if (posts[tribeId][postId].postType == PostType.POLL) {
            polls[postId].isActive = false;
        } else if (posts[tribeId][postId].postType == PostType.QUIZ) {
            quizzes[postId].isActive = false;
        }

        emit PostDeleted(tribeId, postId);
    }

    function getPost(uint256 tribeId, uint256 postId) external view returns (Post memory) {
        return posts[tribeId][postId];
    }

    function getPollOptions(uint256 postId) external view returns (string[] memory) {
        return polls[postId].options;
    }

    function getPollVotes(uint256 postId, uint256 optionIndex) external view returns (uint256) {
        return polls[postId].votes[optionIndex];
    }

    function getQuizQuestions(uint256 postId) external view returns (string[] memory) {
        return quizzes[postId].questions;
    }
} 