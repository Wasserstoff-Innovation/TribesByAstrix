import { expect } from "chai";
import { ethers } from "hardhat";
import { ProjectController, PostMinter, TribeController, RoleManager } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("Project Controller", function () {
    let projectController: ProjectController;
    let postMinter: PostMinter;
    let tribeController: TribeController;
    let roleManager: RoleManager;

    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let projectCreator: SignerWithAddress;
    let teamMember: SignerWithAddress;
    let reviewer: SignerWithAddress;
    let nonMember: SignerWithAddress;
    let tribeId: number;

    function replaceBigInts(obj: any): any {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (typeof obj === 'bigint') return obj.toString();
        
        if (Array.isArray(obj)) {
            return obj.map(item => replaceBigInts(item));
        }
        
        const newObj: any = {};
        for (const key in obj) {
            const value = obj[key];
            if (typeof value === 'bigint') {
                newObj[key] = value.toString();
            } else if (typeof value === 'object' && value !== null) {
                newObj[key] = replaceBigInts(value);
            } else {
                newObj[key] = value;
            }
        }
        return newObj;
    }

    beforeEach(async function () {
        [owner, admin, projectCreator, teamMember, reviewer, nonMember] = await ethers.getSigners();

        // Deploy contracts
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await TribeController.deploy(await roleManager.getAddress());
        await tribeController.waitForDeployment();

        // Deploy PostFeedManager first
        const PostFeedManager = await ethers.getContractFactory("PostFeedManager");
        const feedManager = await PostFeedManager.deploy(await tribeController.getAddress());
        await feedManager.waitForDeployment();

        // Deploy PostMinter with all required arguments
        const PostMinter = await ethers.getContractFactory("PostMinter");
        postMinter = await PostMinter.deploy(
            await roleManager.getAddress(),
            await tribeController.getAddress(),
            ethers.ZeroAddress, // No collectible controller needed for these tests
            await feedManager.getAddress()
        );
        await postMinter.waitForDeployment();

        // Grant admin role to PostMinter in PostFeedManager
        await feedManager.grantRole(await feedManager.DEFAULT_ADMIN_ROLE(), await postMinter.getAddress());

        const ProjectController = await ethers.getContractFactory("ProjectController");
        projectController = await ProjectController.deploy(
            await postMinter.getAddress(),
            await tribeController.getAddress()
        );
        await projectController.waitForDeployment();

        // Setup roles
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("REVIEWER_ROLE")), reviewer.address);
        await projectController.grantRole(ethers.keccak256(ethers.toUtf8Bytes("REVIEWER_ROLE")), reviewer.address);

        // Grant PROJECT_CREATOR_ROLE through RoleManager
        const PROJECT_CREATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_CREATOR_ROLE"));
        await roleManager.grantRole(PROJECT_CREATOR_ROLE, projectCreator.address);
        await roleManager.grantRole(PROJECT_CREATOR_ROLE, teamMember.address);
        await roleManager.grantRole(PROJECT_CREATOR_ROLE, admin.address);

        // Grant admin role to admin in PostMinter
        await postMinter.grantRole(await postMinter.DEFAULT_ADMIN_ROLE(), admin.address);

        // Grant rate limit manager role using admin
        await postMinter.connect(admin).grantRole(await postMinter.RATE_LIMIT_MANAGER_ROLE(), projectCreator.address);
        await postMinter.connect(admin).grantRole(await postMinter.RATE_LIMIT_MANAGER_ROLE(), teamMember.address);
        await postMinter.connect(admin).grantRole(await postMinter.RATE_LIMIT_MANAGER_ROLE(), admin.address);
        
        // Create test tribe
        const tx = await tribeController.connect(admin).createTribe(
            "Test Tribe",
            JSON.stringify({ name: "Test Tribe", description: "A test tribe" }),
            [admin.address],
            0, // PUBLIC
            0, // No entry fee
            [] // No NFT requirements
        );
        const receipt = await tx.wait();
        const event = receipt?.logs.find(
            x => x instanceof EventLog && x.eventName === "TribeCreated"
        ) as EventLog;
        tribeId = event ? Number(event.args[0]) : 0;

        // Add members to tribe
        await tribeController.connect(projectCreator).joinTribe(tribeId);
        await tribeController.connect(teamMember).joinTribe(tribeId);
    });

    describe("Project Creation", function () {
        it("Should create a project from valid post", async function () {
            // Create project post
            const projectData = {
                title: "Test Project",
                content: "Project description",
                type: "PROJECT",
                projectDetails: {
                    totalBudget: ethers.parseEther("10"),
                    startDate: Math.floor(Date.now()/1000) + 3600,
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Milestone 1",
                            budget: ethers.parseEther("5"),
                            deadline: Math.floor(Date.now()/1000) + 15 * 24 * 60 * 60,
                            dependencies: []
                        }
                    ],
                    team: [
                        {
                            address: projectCreator.address,
                            role: "CREATOR",
                            permissions: ["UPDATE", "SUBMIT"]
                        }
                    ]
                }
            };

            const tx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(projectData)),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await tx.wait();
            const postEvent = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = postEvent ? Number(postEvent.args[0]) : 0;

            // Validate and create project
            await expect(
                projectController.connect(projectCreator).validateAndCreateProject(postId)
            ).to.emit(projectController, "ProjectCreated")
             .withArgs(0, postId, projectCreator.address);

            // Verify project data
            const project = await projectController.getProject(0);
            expect(project.creator).to.equal(projectCreator.address);
            expect(project.tribeId).to.equal(tribeId);
            expect(project.status).to.equal(0); // PROPOSED
        });

        it("Should prevent non-creator from validating post", async function () {
            // Create project post
            const projectData = {
                title: "Test Project",
                content: "Project description",
                type: "PROJECT",
                projectDetails: {
                    totalBudget: ethers.parseEther("10"),
                    startDate: Math.floor(Date.now()/1000) + 3600,
                    duration: 30 * 24 * 60 * 60,
                    milestones: []
                }
            };

            const tx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(projectData)),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await tx.wait();
            const postEvent = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = postEvent ? Number(postEvent.args[0]) : 0;

            // Try to validate with different user
            await expect(
                projectController.connect(teamMember).validateAndCreateProject(postId)
            ).to.be.revertedWith("Not post creator");
        });
    });

    describe("Team Management", function () {
        let projectId: number;

        beforeEach(async function () {
            // Create project post
            const projectData = {
                title: "Test Project",
                content: "Project description",
                type: "PROJECT",
                projectDetails: {
                    totalBudget: ethers.parseEther("10"),
                    startDate: Math.floor(Date.now()/1000) + 3600,
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Milestone 1",
                            budget: ethers.parseEther("5"),
                            deadline: Math.floor(Date.now()/1000) + 15 * 24 * 60 * 60,
                            dependencies: []
                        }
                    ],
                    team: [
                        {
                            address: projectCreator.address,
                            role: "CREATOR",
                            permissions: ["UPDATE", "SUBMIT"]
                        }
                    ]
                }
            };

            const tx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(projectData)),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await tx.wait();
            const postEvent = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = postEvent ? Number(postEvent.args[0]) : 0;

            // Create project
            const projectTx = await projectController.connect(projectCreator).validateAndCreateProject(postId);
            const projectReceipt = await projectTx.wait();
            const projectEvent = projectReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProjectCreated"
            ) as EventLog;
            projectId = projectEvent ? Number(projectEvent.args[0]) : 0;
        });

        it("Should allow adding team members", async function () {
            await expect(
                projectController.connect(projectCreator).addTeamMember(projectId, teamMember.address)
            ).to.emit(projectController, "TeamMemberAdded")
             .withArgs(projectId, teamMember.address);

            const project = await projectController.getProject(projectId);
            expect(project.team).to.include(teamMember.address);
        });

        it("Should prevent non-creator from adding team members", async function () {
            await expect(
                projectController.connect(teamMember).addTeamMember(projectId, nonMember.address)
            ).to.be.revertedWith("Not project creator");
        });

        it("Should prevent adding duplicate team members", async function () {
            await projectController.connect(projectCreator).addTeamMember(projectId, teamMember.address);

            await expect(
                projectController.connect(projectCreator).addTeamMember(projectId, teamMember.address)
            ).to.be.revertedWith("Already team member");
        });
    });

    describe("Milestone Management", function () {
        let projectId: number;

        beforeEach(async function () {
            // Create project post with milestone
            const projectData = {
                title: "Test Project",
                content: "Project description",
                type: "PROJECT",
                projectDetails: {
                    totalBudget: ethers.parseEther("10"),
                    startDate: Math.floor(Date.now()/1000) + 3600,
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Milestone 1",
                            budget: ethers.parseEther("5"),
                            deadline: Math.floor(Date.now()/1000) + 15 * 24 * 60 * 60,
                            dependencies: []
                        }
                    ],
                    team: [
                        {
                            address: projectCreator.address,
                            role: "CREATOR",
                            permissions: ["UPDATE", "SUBMIT"]
                        }
                    ]
                }
            };

            const tx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(projectData)),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await tx.wait();
            const postEvent = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = postEvent ? Number(postEvent.args[0]) : 0;

            // Create project
            const projectTx = await projectController.connect(projectCreator).validateAndCreateProject(postId);
            const projectReceipt = await projectTx.wait();
            const projectEvent = projectReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProjectCreated"
            ) as EventLog;
            projectId = projectEvent ? Number(projectEvent.args[0]) : 0;

            // Add team member
            await projectController.connect(projectCreator).addTeamMember(projectId, teamMember.address);
        });

        it("Should allow starting a milestone", async function () {
            await expect(
                projectController.connect(teamMember).startMilestone(projectId, 0)
            ).to.emit(projectController, "MilestoneUpdated")
             .withArgs(projectId, 0, 1); // IN_PROGRESS

            const milestone = await projectController.getMilestone(projectId, 0);
            expect(milestone.status).to.equal(1); // IN_PROGRESS
        });

        it("Should allow submitting milestone deliverables", async function () {
            // Start milestone first
            await projectController.connect(teamMember).startMilestone(projectId, 0);

            await expect(
                projectController.connect(teamMember).submitMilestoneDeliverable(
                    projectId,
                    0,
                    "ipfs://deliverables"
                )
            ).to.emit(projectController, "MilestoneUpdated")
             .withArgs(projectId, 0, 2); // UNDER_REVIEW

            const milestone = await projectController.getMilestone(projectId, 0);
            expect(milestone.status).to.equal(2); // UNDER_REVIEW
            expect(milestone.deliverables).to.equal("ipfs://deliverables");
        });

        it("Should allow reviewer to approve milestone", async function () {
            // Start milestone and submit deliverable first
            await projectController.connect(teamMember).startMilestone(projectId, 0);
            await projectController.connect(teamMember).submitMilestoneDeliverable(
                projectId,
                0,
                "ipfs://deliverables"
            );

            // Review milestone
            await expect(
                projectController.connect(reviewer).reviewMilestone(projectId, 0, true)
            ).to.emit(projectController, "MilestoneUpdated")
             .withArgs(projectId, 0, 3); // COMPLETED

            const milestone = await projectController.getMilestone(projectId, 0);
            expect(milestone.status).to.equal(3); // COMPLETED
            expect(milestone.reviewer).to.equal(reviewer.address);
        });

        it("Should allow reviewer to reject milestone", async function () {
            // Start milestone and submit deliverable first
            await projectController.connect(teamMember).startMilestone(projectId, 0);
            await projectController.connect(teamMember).submitMilestoneDeliverable(
                projectId,
                0,
                "ipfs://deliverables"
            );

            // Review milestone
            await expect(
                projectController.connect(reviewer).reviewMilestone(projectId, 0, false)
            ).to.emit(projectController, "MilestoneUpdated")
             .withArgs(projectId, 0, 4); // REJECTED

            const milestone = await projectController.getMilestone(projectId, 0);
            expect(milestone.status).to.equal(4); // REJECTED
            expect(milestone.reviewer).to.equal(reviewer.address);
        });

        it("Should prevent non-reviewer from reviewing milestone", async function () {
            // Start milestone and submit deliverable first
            await projectController.connect(teamMember).startMilestone(projectId, 0);
            await projectController.connect(teamMember).submitMilestoneDeliverable(
                projectId,
                0,
                "ipfs://deliverables"
            );

            // Try to review without reviewer role
            await expect(
                projectController.connect(teamMember).reviewMilestone(projectId, 0, true)
            ).to.be.revertedWith("Not reviewer");
        });

        it("Should prevent submitting deliverables for non-started milestone", async function () {
            await expect(
                projectController.connect(teamMember).submitMilestoneDeliverable(
                    projectId,
                    0,
                    "ipfs://deliverables"
                )
            ).to.be.revertedWith("Invalid status");
        });

        it("Should prevent starting milestone with incomplete dependencies", async function () {
            // Create project with dependent milestones
            const projectData = {
                title: "Test Project",
                content: "Project description",
                type: "PROJECT",
                projectDetails: {
                    totalBudget: ethers.parseEther("10"),
                    startDate: Math.floor(Date.now()/1000) + 3600,
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Milestone 1",
                            budget: ethers.parseEther("3"),
                            deadline: Math.floor(Date.now()/1000) + 7 * 24 * 60 * 60,
                            dependencies: [],
                            status: "PENDING"
                        },
                        {
                            title: "Milestone 2",
                            budget: ethers.parseEther("7"),
                            deadline: Math.floor(Date.now()/1000) + 15 * 24 * 60 * 60,
                            dependencies: [0], // Depends on Milestone 1
                            status: "PENDING"
                        }
                    ],
                    team: [
                        {
                            address: projectCreator.address,
                            role: "CREATOR",
                            permissions: ["UPDATE", "SUBMIT"]
                        }
                    ]
                }
            };

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]); // 61 seconds
            await ethers.provider.send("evm_mine", []);

            const tx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(projectData)),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await tx.wait();
            const postEvent = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = postEvent ? Number(postEvent.args[0]) : 0;

            // Create project
            const projectTx = await projectController.connect(projectCreator).validateAndCreateProject(postId);
            const projectReceipt = await projectTx.wait();
            const projectEvent = projectReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProjectCreated"
            ) as EventLog;
            const dependentProjectId = projectEvent ? Number(projectEvent.args[0]) : 0;

            // Try to start second milestone before first is completed
            await expect(
                projectController.connect(projectCreator).startMilestone(dependentProjectId, 1)
            ).to.be.revertedWith("Dependencies not completed");

            // Complete first milestone
            await projectController.connect(projectCreator).startMilestone(dependentProjectId, 0);
            await projectController.connect(projectCreator).submitMilestoneDeliverable(
                dependentProjectId,
                0,
                "ipfs://deliverables"
            );
            await projectController.connect(reviewer).reviewMilestone(dependentProjectId, 0, true);

            // Now should be able to start second milestone
            await expect(
                projectController.connect(projectCreator).startMilestone(dependentProjectId, 1)
            ).to.emit(projectController, "MilestoneUpdated")
             .withArgs(dependentProjectId, 1, 1); // IN_PROGRESS
        });
    });

    describe("Security Scenarios", function () {
        let projectId: number;
        let maliciousUser: SignerWithAddress;

        beforeEach(async function () {
            [maliciousUser] = await ethers.getSigners();

            // Create project post
            const projectData = {
                title: "Test Project",
                content: "Project description",
                type: "PROJECT",
                projectDetails: {
                    totalBudget: ethers.parseEther("10"),
                    startDate: Math.floor(Date.now()/1000) + 3600,
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Milestone 1",
                            budget: ethers.parseEther("5"),
                            deadline: Math.floor(Date.now()/1000) + 15 * 24 * 60 * 60,
                            dependencies: []
                        }
                    ],
                    team: [
                        {
                            address: projectCreator.address,
                            role: "CREATOR",
                            permissions: ["UPDATE", "SUBMIT"]
                        }
                    ]
                }
            };

            const tx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(projectData)),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await tx.wait();
            const postEvent = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const postId = postEvent ? Number(postEvent.args[0]) : 0;

            // Create project
            const projectTx = await projectController.connect(projectCreator).validateAndCreateProject(postId);
            const projectReceipt = await projectTx.wait();
            const projectEvent = projectReceipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "ProjectCreated"
            ) as EventLog;
            projectId = projectEvent ? Number(projectEvent.args[0]) : 0;
        });

        it("Should prevent unauthorized milestone updates", async function () {
            await expect(
                projectController.connect(maliciousUser).submitMilestoneDeliverable(
                    projectId,
                    0,
                    "ipfs://malicious"
                )
            ).to.be.revertedWith("Not team member");
        });

        it("Should prevent unauthorized team member additions", async function () {
            await expect(
                projectController.connect(maliciousUser).addTeamMember(
                    projectId,
                    maliciousUser.address
                )
            ).to.be.revertedWith("Not project creator");
        });

        it("Should prevent milestone review manipulation", async function () {
            // Add legitimate team member
            await projectController.connect(projectCreator).addTeamMember(projectId, teamMember.address);

            // Start milestone
            await projectController.connect(teamMember).startMilestone(projectId, 0);

            // Submit deliverable
            await projectController.connect(teamMember).submitMilestoneDeliverable(
                projectId,
                0,
                "ipfs://deliverables"
            );

            // Try to review without reviewer role
            await expect(
                projectController.connect(maliciousUser).reviewMilestone(
                    projectId,
                    0,
                    true
                )
            ).to.be.revertedWith("Not reviewer");
        });
    });
}); 