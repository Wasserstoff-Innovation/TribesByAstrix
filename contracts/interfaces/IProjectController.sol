// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IProjectController {
    enum ProjectStatus { PROPOSED, ACTIVE, COMPLETED, CANCELLED }
    enum MilestoneStatus { PENDING, IN_PROGRESS, UNDER_REVIEW, COMPLETED, REJECTED }

    struct Milestone {
        string title;
        uint256 budget;
        uint256 deadline;
        MilestoneStatus status;
        uint256[] dependencies;
        string deliverables;
        uint256 completedAt;
        address reviewer;
    }

    event ProjectCreated(uint256 indexed projectId, uint256 indexed postId, address creator);
    event MilestoneUpdated(uint256 indexed projectId, uint256 indexed milestoneIndex, MilestoneStatus status);
    event TeamMemberAdded(uint256 indexed projectId, address indexed member);
    event ProjectStatusUpdated(uint256 indexed projectId, ProjectStatus status);

    function validateAndCreateProject(uint256 postId) external returns (uint256);
    function validateAndCreateUpdate(uint256 postId) external;
    function addTeamMember(uint256 projectId, address member) external;
    function startMilestone(uint256 projectId, uint256 milestoneIndex) external;
    function submitMilestoneDeliverable(uint256 projectId, uint256 milestoneIndex, string calldata deliverableURI) external;
    function reviewMilestone(uint256 projectId, uint256 milestoneIndex, bool approved) external;
    
    function getProject(uint256 projectId) external view returns (
        uint256 postId,
        address creator,
        uint256 tribeId,
        ProjectStatus status,
        uint256 totalBudget,
        uint256 startDate,
        uint256 duration,
        address[] memory team
    );
    
    function getMilestone(uint256 projectId, uint256 milestoneIndex) external view returns (Milestone memory);
} 