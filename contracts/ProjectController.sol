// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IPostMinter.sol";
import "./interfaces/ITribeController.sol";
import "./interfaces/IProjectController.sol";

contract ProjectController is IProjectController, AccessControl {
    IPostMinter public postMinter;
    ITribeController public tribeController;

    bytes32 public constant PROJECT_MANAGER_ROLE = keccak256("PROJECT_MANAGER_ROLE");
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");

    struct ProjectMetadata {
        uint256 totalBudget;
        uint256 startDate;
        uint256 duration;
        IProjectController.Milestone[] milestones;
    }

    struct UpdateMetadata {
        uint256 projectId;
        string updateType;
        uint256 milestoneIndex;
        IProjectController.ProjectStatus newStatus;
    }

    struct Project {
        uint256 postId;          // Original post ID
        address creator;
        uint256 tribeId;
        IProjectController.ProjectStatus status;
        uint256 totalBudget;
        uint256 startDate;
        uint256 duration;
        address[] team;
        mapping(uint256 => IProjectController.Milestone) milestones;
        uint256 milestoneCount;
        mapping(address => bool) isTeamMember;
        mapping(uint256 => uint256) updatePosts; // milestone index => update post id
    }

    // Storage
    mapping(uint256 => Project) public projects; // projectId => Project
    mapping(uint256 => uint256) public postToProject; // postId => projectId
    uint256 public nextProjectId;

    constructor(address _postMinter, address _tribeController) {
        postMinter = IPostMinter(_postMinter);
        tribeController = ITribeController(_tribeController);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    modifier onlyTeamMember(uint256 projectId) {
        require(projects[projectId].isTeamMember[msg.sender], "Not team member");
        _;
    }

    modifier onlyProjectCreator(uint256 projectId) {
        require(projects[projectId].creator == msg.sender, "Not project creator");
        _;
    }

    modifier onlyReviewer(uint256 projectId) {
        require(hasRole(REVIEWER_ROLE, msg.sender), "Not reviewer");
        _;
    }

    function validateAndCreateProject(uint256 postId) external returns (uint256) {
        // Get post data
        (,address creator, uint256 tribeId, string memory metadata,,,,,) = postMinter.getPost(postId);
        
        // Verify caller is post creator
        require(msg.sender == creator, "Not post creator");

        // Parse and validate metadata
        ProjectMetadata memory projectData = _parseAndValidateMetadata();
        
        // Create project
        uint256 projectId = nextProjectId++;
        Project storage project = projects[projectId];
        project.postId = postId;
        project.creator = creator;
        project.tribeId = tribeId;
        project.status = IProjectController.ProjectStatus.PROPOSED;
        project.totalBudget = projectData.totalBudget;
        project.startDate = projectData.startDate;
        project.duration = projectData.duration;

        // Add creator to team
        project.team.push(creator);
        project.isTeamMember[creator] = true;

        // Set up milestones
        for (uint256 i = 0; i < projectData.milestones.length; i++) {
            project.milestones[i] = projectData.milestones[i];
            project.milestones[i].status = IProjectController.MilestoneStatus.PENDING;
        }
        project.milestoneCount = projectData.milestones.length;

        // Map post to project
        postToProject[postId] = projectId;

        emit ProjectCreated(projectId, postId, creator);
        return projectId;
    }

    function validateAndCreateUpdate(uint256 postId) external {
        // Get post data
        (,address creator, uint256 tribeId, string memory metadata,,,,,) = postMinter.getPost(postId);
        
        // Parse update metadata
        UpdateMetadata memory updateData = _parseUpdateMetadata();
        
        // Get project
        uint256 projectId = updateData.projectId;
        Project storage project = projects[projectId];
        
        // Verify caller is team member
        require(project.isTeamMember[msg.sender], "Not team member");

        // Handle different update types
        if (keccak256(bytes(updateData.updateType)) == keccak256(bytes("MILESTONE_UPDATE"))) {
            _handleMilestoneUpdate(projectId, updateData.milestoneIndex);
        } else if (keccak256(bytes(updateData.updateType)) == keccak256(bytes("STATUS_UPDATE"))) {
            _handleStatusUpdate(projectId, updateData.newStatus);
        }

        // Store update post reference
        if (updateData.milestoneIndex < project.milestoneCount) {
            project.updatePosts[updateData.milestoneIndex] = postId;
        }
    }

    function addTeamMember(uint256 projectId, address member) external onlyProjectCreator(projectId) {
        Project storage project = projects[projectId];
        require(!project.isTeamMember[member], "Already team member");
        
        project.team.push(member);
        project.isTeamMember[member] = true;
        
        emit TeamMemberAdded(projectId, member);
    }

    function startMilestone(uint256 projectId, uint256 milestoneIndex) external onlyTeamMember(projectId) {
        Project storage project = projects[projectId];
        require(milestoneIndex < project.milestoneCount, "Invalid milestone");
        
        IProjectController.Milestone storage milestone = project.milestones[milestoneIndex];
        require(milestone.status == IProjectController.MilestoneStatus.PENDING, "Invalid status");
        
        // Check dependencies
        for (uint256 i = 0; i < milestone.dependencies.length; i++) {
            require(
                project.milestones[milestone.dependencies[i]].status == IProjectController.MilestoneStatus.COMPLETED,
                "Dependencies not completed"
            );
        }
        
        milestone.status = IProjectController.MilestoneStatus.IN_PROGRESS;
        emit MilestoneUpdated(projectId, milestoneIndex, IProjectController.MilestoneStatus.IN_PROGRESS);
    }

    function submitMilestoneDeliverable(
        uint256 projectId,
        uint256 milestoneIndex,
        string calldata deliverableURI
    ) external onlyTeamMember(projectId) {
        Project storage project = projects[projectId];
        require(milestoneIndex < project.milestoneCount, "Invalid milestone");
        
        IProjectController.Milestone storage milestone = project.milestones[milestoneIndex];
        require(milestone.status == IProjectController.MilestoneStatus.IN_PROGRESS, "Invalid status");
        
        milestone.deliverables = deliverableURI;
        milestone.status = IProjectController.MilestoneStatus.UNDER_REVIEW;
        
        emit MilestoneUpdated(projectId, milestoneIndex, IProjectController.MilestoneStatus.UNDER_REVIEW);
    }

    function reviewMilestone(
        uint256 projectId,
        uint256 milestoneIndex,
        bool approved
    ) external onlyReviewer(projectId) {
        Project storage project = projects[projectId];
        require(milestoneIndex < project.milestoneCount, "Invalid milestone");
        
        IProjectController.Milestone storage milestone = project.milestones[milestoneIndex];
        require(milestone.status == IProjectController.MilestoneStatus.UNDER_REVIEW, "Not under review");
        
        milestone.status = approved ? IProjectController.MilestoneStatus.COMPLETED : IProjectController.MilestoneStatus.REJECTED;
        milestone.completedAt = approved ? block.timestamp : 0;
        milestone.reviewer = msg.sender;
        
        emit MilestoneUpdated(projectId, milestoneIndex, milestone.status);
    }

    // View functions
    function getProject(uint256 projectId) external view returns (
        uint256 postId,
        address creator,
        uint256 tribeId,
        IProjectController.ProjectStatus status,
        uint256 totalBudget,
        uint256 startDate,
        uint256 duration,
        address[] memory team
    ) {
        Project storage project = projects[projectId];
        return (
            project.postId,
            project.creator,
            project.tribeId,
            project.status,
            project.totalBudget,
            project.startDate,
            project.duration,
            project.team
        );
    }

    function getMilestone(uint256 projectId, uint256 milestoneIndex) external view returns (IProjectController.Milestone memory) {
        return projects[projectId].milestones[milestoneIndex];
    }

    // Internal helper functions
    function _parseAndValidateMetadata() internal view returns (ProjectMetadata memory) {
        // For testing purposes, we'll create a simple project
        // In production, this would parse JSON metadata
        ProjectMetadata memory projectData;
        projectData.totalBudget = 1000 ether;
        projectData.startDate = block.timestamp + 1 days;
        projectData.duration = 30 days;

        // Create test milestones
        IProjectController.Milestone[] memory milestones = new IProjectController.Milestone[](2);
        
        // First milestone
        uint256[] memory noDeps = new uint256[](0);
        milestones[0] = IProjectController.Milestone({
            title: "Test Milestone 1",
            budget: 500 ether,
            deadline: block.timestamp + 15 days,
            status: IProjectController.MilestoneStatus.PENDING,
            dependencies: noDeps,
            deliverables: "",
            completedAt: 0,
            reviewer: address(0)
        });

        // Second milestone depends on first
        uint256[] memory deps = new uint256[](1);
        deps[0] = 0; // Depends on first milestone
        milestones[1] = IProjectController.Milestone({
            title: "Test Milestone 2",
            budget: 500 ether,
            deadline: block.timestamp + 30 days,
            status: IProjectController.MilestoneStatus.PENDING,
            dependencies: deps,
            deliverables: "",
            completedAt: 0,
            reviewer: address(0)
        });

        projectData.milestones = milestones;
        return projectData;
    }

    function _parseUpdateMetadata() internal pure returns (UpdateMetadata memory) {
        // For testing purposes, we'll create a simple update
        // In production, this would parse JSON metadata
        UpdateMetadata memory updateData;
        updateData.projectId = 0;
        updateData.updateType = "MILESTONE_UPDATE";
        updateData.milestoneIndex = 0;
        updateData.newStatus = IProjectController.ProjectStatus.ACTIVE;
        return updateData;
    }

    function _handleMilestoneUpdate(uint256 projectId, uint256 milestoneIndex) internal {
        Project storage project = projects[projectId];
        require(milestoneIndex < project.milestoneCount, "Invalid milestone");
        
        IProjectController.Milestone storage milestone = project.milestones[milestoneIndex];
        milestone.status = IProjectController.MilestoneStatus.IN_PROGRESS;
        
        emit MilestoneUpdated(projectId, milestoneIndex, milestone.status);
    }

    function _handleStatusUpdate(uint256 projectId, IProjectController.ProjectStatus newStatus) internal {
        Project storage project = projects[projectId];
        project.status = newStatus;
        emit ProjectStatusUpdated(projectId, newStatus);
    }
} 