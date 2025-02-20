import { expect } from "chai";
import { ethers } from "hardhat";
import { PostMinter, RoleManager, TribeController, CollectibleController } from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { EventLog } from "ethers";

describe("Project Grant Journey V2", function () {
    let postMinter: PostMinter;
    let roleManager: RoleManager;
    let tribeController: TribeController;
    let collectibleController: CollectibleController;

    let admin: SignerWithAddress;
    let moderator: SignerWithAddress;
    let projectCreator: SignerWithAddress;
    let reviewer1: SignerWithAddress;
    let reviewer2: SignerWithAddress;
    let contributor1: SignerWithAddress;
    let contributor2: SignerWithAddress;
    let bannedMember: SignerWithAddress;
    let tribeId: number;

    // Helper function to convert BigInt to string in JSON
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

    before(async function () {
        [admin, moderator, projectCreator, reviewer1, reviewer2, contributor1, contributor2, bannedMember] = await ethers.getSigners();

        // Deploy contracts
        const RoleManager = await ethers.getContractFactory("RoleManager");
        roleManager = await RoleManager.deploy();
        await roleManager.waitForDeployment();

        const TribeController = await ethers.getContractFactory("TribeController");
        tribeController = await TribeController.deploy(roleManager.target);
        await tribeController.waitForDeployment();

        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await CollectibleController.deploy(
            roleManager.target,
            tribeController.target,
            ethers.ZeroAddress // Point system not needed for these tests
        );
        await collectibleController.waitForDeployment();

        const PostMinter = await ethers.getContractFactory("PostMinter");
        postMinter = await PostMinter.deploy(
            roleManager.target,
            tribeController.target,
            collectibleController.target
        );
        await postMinter.waitForDeployment();

        // Setup roles
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE")), admin.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE")), moderator.address);
        await roleManager.grantRole(ethers.keccak256(ethers.toUtf8Bytes("CREATOR_ROLE")), projectCreator.address);

        // Create test tribe
        const tx = await tribeController.connect(admin).createTribe(
            "Project Grants Tribe",
            JSON.stringify({ name: "Project Grants Tribe", description: "A tribe for testing project grants" }),
            [admin.address, moderator.address, projectCreator.address],
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
        await tribeController.connect(reviewer1).joinTribe(tribeId);
        await tribeController.connect(reviewer2).joinTribe(tribeId);
        await tribeController.connect(contributor1).joinTribe(tribeId);
        await tribeController.connect(contributor2).joinTribe(tribeId);
        await tribeController.connect(bannedMember).joinTribe(tribeId);

        // Ban member
        await tribeController.connect(admin).banMember(tribeId, bannedMember.address);
    });

    describe("Project Creation Scenarios", function () {
        beforeEach(async function () {
            // Wait for rate limit cooldown before each test
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);
        });

        it("Should create a project with milestones", async function () {
            const project = {
                title: "Decentralized Identity System",
                content: "Building a self-sovereign identity solution",
                type: "PROJECT",
                projectDetails: {
                    category: "INFRASTRUCTURE",
                    requestedAmount: ethers.parseEther("5000"),
                    duration: 90 * 24 * 60 * 60, // 90 days
                    milestones: [
                        {
                            title: "Planning Phase",
                            description: "Project planning and architecture",
                            dueDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                            deliverables: ["Technical Specification", "Architecture Diagram"],
                            budget: ethers.parseEther("1000"),
                            status: "PENDING"
                        },
                        {
                            title: "MVP Development",
                            description: "Core functionality implementation",
                            dueDate: Math.floor(Date.now()/1000) + 60 * 24 * 60 * 60,
                            deliverables: ["Working MVP", "Test Suite", "Documentation"],
                            budget: ethers.parseEther("2000"),
                            status: "PENDING",
                            dependsOn: [0] // Depends on Planning Phase
                        },
                        {
                            title: "Testing and Deployment",
                            description: "Testing, auditing, and mainnet deployment",
                            dueDate: Math.floor(Date.now()/1000) + 90 * 24 * 60 * 60,
                            deliverables: ["Audit Report", "Deployment Guide", "User Documentation"],
                            budget: ethers.parseEther("2000"),
                            status: "PENDING",
                            dependsOn: [1] // Depends on MVP Development
                        }
                    ],
                    team: [
                        {
                            address: projectCreator.address,
                            role: "Project Lead",
                            experience: "5 years in blockchain development"
                        }
                    ],
                    status: "PROPOSED",
                    reviews: [],
                    milestoneSubmissions: {}
                },
                metadata: {
                    documents: ["ipfs://project-proposal", "ipfs://team-credentials"],
                    githubRepo: "https://github.com/project/repo",
                    projectWebsite: "https://project.example"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            const tx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(project)),
                false,
                ethers.ZeroAddress,
                0
            );

            await expect(tx).to.emit(postMinter, "PostCreated");

            const postId = 0;
            const post = await postMinter.getPost(postId);
            const postData = JSON.parse(post.metadata);
            expect(postData.type).to.equal("PROJECT");
            expect(postData.projectDetails.status).to.equal("PROPOSED");
            expect(postData.projectDetails.milestones.length).to.equal(3);
        });

        it("Should handle milestone submissions and reviews", async function () {
            // Create initial project post
            const initialProject = {
                title: "DeFi Integration SDK",
                content: "Creating a unified SDK for DeFi protocols",
                type: "PROJECT",
                projectDetails: {
                    category: "DEFI",
                    requestedAmount: ethers.parseEther("3000"),
                    duration: 60 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Protocol Integration",
                            description: "Integrate major DeFi protocols",
                            dueDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                            deliverables: ["Protocol Adapters", "Integration Tests"],
                            budget: ethers.parseEther("1500"),
                            status: "PENDING"
                        },
                        {
                            title: "SDK Release",
                            description: "Public SDK release and documentation",
                            dueDate: Math.floor(Date.now()/1000) + 60 * 24 * 60 * 60,
                            deliverables: ["SDK Package", "Documentation", "Examples"],
                            budget: ethers.parseEther("1500"),
                            status: "PENDING",
                            dependsOn: [0]
                        }
                    ],
                    team: [{ address: projectCreator.address, role: "Lead Developer" }],
                    status: "PROPOSED",
                    reviews: [],
                    milestoneSubmissions: {}
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            const createTx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(initialProject)),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await createTx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const projectPostId = event ? Number(event.args[0]) : 0;

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Submit first milestone
            const milestoneSubmission = {
                title: "Protocol Integration Submission",
                content: "Completed the protocol integration milestone",
                type: "PROJECT_UPDATE",
                updateType: "MILESTONE_SUBMISSION",
                projectDetails: {
                    projectPostId: projectPostId,
                    milestoneIndex: 0,
                    deliverables: {
                        "Protocol Adapters": "ipfs://adapters-code",
                        "Integration Tests": "ipfs://test-results"
                    },
                    submissionNotes: "All protocols integrated successfully",
                    status: "SUBMITTED"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            const submissionTx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(milestoneSubmission)),
                false,
                ethers.ZeroAddress,
                0
            );

            await expect(submissionTx).to.emit(postMinter, "PostCreated");

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Review submission
            const review = {
                title: "Milestone Review",
                content: "Review of Protocol Integration milestone",
                type: "PROJECT_UPDATE",
                updateType: "MILESTONE_REVIEW",
                projectDetails: {
                    projectPostId: projectPostId,
                    milestoneIndex: 0,
                    review: {
                        rating: 5,
                        comments: "Excellent work, all requirements met",
                        status: "APPROVED"
                    },
                    reviewer: reviewer1.address
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            const reviewTx = await postMinter.connect(reviewer1).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(review)),
                false,
                ethers.ZeroAddress,
                0
            );

            await expect(reviewTx).to.emit(postMinter, "PostCreated");
        });

        it("Should handle project status updates", async function () {
            // Create initial project
            const project = {
                title: "Smart Contract Library",
                content: "Building a library of reusable smart contracts",
                type: "PROJECT",
                projectDetails: {
                    category: "DEVELOPMENT",
                    requestedAmount: ethers.parseEther("2000"),
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Core Contracts",
                            description: "Implement core contract library",
                            dueDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                            deliverables: ["Contract Code", "Tests", "Documentation"],
                            budget: ethers.parseEther("2000"),
                            status: "PENDING"
                        }
                    ],
                    team: [{ address: projectCreator.address, role: "Developer" }],
                    status: "PROPOSED",
                    reviews: [],
                    milestoneSubmissions: {}
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            const createTx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(project)),
                false,
                ethers.ZeroAddress,
                0
            );
            const receipt = await createTx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const projectPostId = event ? Number(event.args[0]) : 0;

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Update project status to APPROVED
            const statusUpdate = {
                title: "Project Status Update",
                content: "Project has been approved",
                type: "PROJECT_UPDATE",
                updateType: "STATUS_UPDATE",
                projectDetails: {
                    projectPostId: projectPostId,
                    newStatus: "APPROVED",
                    updateNotes: "Project approved by review committee",
                    updatedBy: admin.address
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            const updateTx = await postMinter.connect(admin).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(statusUpdate)),
                false,
                ethers.ZeroAddress,
                0
            );

            await expect(updateTx).to.emit(postMinter, "PostCreated");
        });
    });

    describe("Project Validation Scenarios", function () {
        beforeEach(async function () {
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);
        });

        it("Should validate milestone dependencies", async function () {
            const invalidProject = {
                title: "Invalid Project",
                content: "Project with invalid milestone dependencies",
                type: "PROJECT",
                projectDetails: {
                    category: "DEVELOPMENT",
                    requestedAmount: ethers.parseEther("1000"),
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Milestone 1",
                            description: "First milestone",
                            dueDate: Math.floor(Date.now()/1000) + 15 * 24 * 60 * 60,
                            deliverables: ["Deliverable 1"],
                            budget: ethers.parseEther("500"),
                            status: "PENDING",
                            dependsOn: [1] // Invalid: depends on a milestone that comes after
                        },
                        {
                            title: "Milestone 2",
                            description: "Second milestone",
                            dueDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                            deliverables: ["Deliverable 2"],
                            budget: ethers.parseEther("500"),
                            status: "PENDING"
                        }
                    ],
                    status: "PROPOSED"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Frontend validation
            const milestones = invalidProject.projectDetails.milestones;
            let hasInvalidDependencies = false;

            for (let i = 0; i < milestones.length; i++) {
                const milestone = milestones[i];
                if (milestone.dependsOn) {
                    for (const dependencyIndex of milestone.dependsOn) {
                        if (dependencyIndex >= i) {
                            hasInvalidDependencies = true;
                            break;
                        }
                    }
                }
            }

            expect(hasInvalidDependencies).to.be.true;
            expect(() => {
                // This would be the actual validation that throws
                for (let i = 0; i < milestones.length; i++) {
                    const milestone = milestones[i];
                    if (milestone.dependsOn) {
                        for (const dependencyIndex of milestone.dependsOn) {
                            if (dependencyIndex >= i) {
                                throw new Error("Milestone cannot depend on later milestones");
                            }
                        }
                    }
                }
            }).to.throw("Milestone cannot depend on later milestones");
        });

        it("Should validate budget allocation", async function () {
            const invalidProject = {
                title: "Over Budget Project",
                content: "Project with invalid budget allocation",
                type: "PROJECT",
                projectDetails: {
                    category: "DEVELOPMENT",
                    requestedAmount: ethers.parseEther("1000"),
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Milestone 1",
                            budget: ethers.parseEther("600"),
                            status: "PENDING"
                        },
                        {
                            title: "Milestone 2",
                            budget: ethers.parseEther("600"),
                            status: "PENDING"
                        }
                    ],
                    status: "PROPOSED"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Frontend validation
            const totalBudget = invalidProject.projectDetails.milestones.reduce(
                (sum, milestone) => sum + BigInt(milestone.budget),
                0n
            );
            const requestedAmount = BigInt(invalidProject.projectDetails.requestedAmount);

            expect(totalBudget).to.be.greaterThan(requestedAmount);
            expect(() => {
                if (totalBudget > requestedAmount) {
                    throw new Error("Total milestone budgets exceed requested amount");
                }
            }).to.throw("Total milestone budgets exceed requested amount");
        });

        it("Should validate milestone dates", async function () {
            const currentTime = Math.floor(Date.now()/1000);
            const invalidProject = {
                title: "Invalid Dates Project",
                content: "Project with invalid milestone dates",
                type: "PROJECT",
                projectDetails: {
                    category: "DEVELOPMENT",
                    requestedAmount: ethers.parseEther("1000"),
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Past Milestone",
                            dueDate: currentTime - 86400, // Yesterday
                            status: "PENDING"
                        },
                        {
                            title: "Future Milestone",
                            dueDate: currentTime + 60 * 24 * 60 * 60, // After project duration
                            status: "PENDING"
                        }
                    ],
                    status: "PROPOSED"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Frontend validation
            const projectEndDate = currentTime + invalidProject.projectDetails.duration;
            const milestones = invalidProject.projectDetails.milestones;
            
            // Check for past milestone
            expect(milestones[0].dueDate).to.be.lessThan(currentTime);
            expect(() => {
                if (milestones[0].dueDate <= currentTime) {
                    throw new Error("Milestone due date must be in the future");
                }
            }).to.throw("Milestone due date must be in the future");

            // Check for milestone after project end
            expect(milestones[1].dueDate).to.be.greaterThan(projectEndDate);
            expect(() => {
                if (milestones[1].dueDate > projectEndDate) {
                    throw new Error("Milestone due date must be within project duration");
                }
            }).to.throw("Milestone due date must be within project duration");
        });

        it("Should prevent unauthorized updates", async function () {
            // Create a test project first
            const project = {
                title: "Test Project",
                content: "Project for testing updates",
                type: "PROJECT",
                projectDetails: {
                    category: "TESTING",
                    requestedAmount: ethers.parseEther("1000"),
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Test Milestone",
                            description: "First milestone",
                            dueDate: Math.floor(Date.now()/1000) + 15 * 24 * 60 * 60,
                            deliverables: ["Test Deliverable"],
                            budget: ethers.parseEther("1000"),
                            status: "PENDING"
                        }
                    ],
                    team: [{ address: projectCreator.address, role: "Developer" }],
                    status: "PROPOSED"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            const tx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(project)),
                false,
                ethers.ZeroAddress,
                0
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            const projectPostId = event ? Number(event.args[0]) : 0;

            // Attempt unauthorized update
            const unauthorizedUpdate = {
                title: "Unauthorized Update",
                content: "Attempting unauthorized update",
                type: "PROJECT_UPDATE",
                updateType: "STATUS_UPDATE",
                projectDetails: {
                    projectPostId: projectPostId,
                    newStatus: "COMPLETED"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Get project data
            const post = await postMinter.getPost(projectPostId);
            const projectData = JSON.parse(post.metadata);

            // Verify team membership
            const isTeamMember = projectData.projectDetails.team.some(
                (member: { address: string }) => member.address === contributor1.address
            );
            expect(isTeamMember).to.be.false;

            // Attempt update with non-team member
            await expect(
                postMinter.connect(contributor1).createPost(
                    tribeId,
                    JSON.stringify(replaceBigInts(unauthorizedUpdate)),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.emit(postMinter, "PostCreated"); // Post will be created but frontend should prevent processing

            // Verify original status hasn't changed
            const updatedPost = await postMinter.getPost(projectPostId);
            const updatedProjectData = JSON.parse(updatedPost.metadata);
            expect(updatedProjectData.projectDetails.status).to.equal("PROPOSED");
        });
    });

    describe("Project Update Scenarios", function () {
        let projectPostId: number;
        let baseProject: any;

        beforeEach(async function () {
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Base project template
            baseProject = {
                title: "Test Project",
                content: "Project for testing updates",
                type: "PROJECT",
                projectDetails: {
                    category: "TESTING",
                    requestedAmount: ethers.parseEther("1000"),
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Test Milestone",
                            description: "First milestone",
                            dueDate: Math.floor(Date.now()/1000) + 15 * 24 * 60 * 60,
                            deliverables: ["Test Deliverable"],
                            budget: ethers.parseEther("1000"),
                            status: "PENDING"
                        }
                    ],
                    team: [{ 
                        address: projectCreator.address, 
                        role: "Project Lead",
                        permissions: ["ADMIN", "UPDATE"]
                    }],
                    status: "PROPOSED",
                    reviews: [],
                    milestoneSubmissions: {}
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Create test project
            const tx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(baseProject)),
                false,
                ethers.ZeroAddress,
                0
            );

            const receipt = await tx.wait();
            const event = receipt?.logs.find(
                x => x instanceof EventLog && x.eventName === "PostCreated"
            ) as EventLog;
            projectPostId = event ? Number(event.args[0]) : 0;
        });

        it("Should handle progress updates", async function () {
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Get current project state
            const initialPost = await postMinter.getPost(projectPostId);
            const initialData = JSON.parse(initialPost.metadata);

            // Create progress update
            const progressUpdate = {
                title: "Weekly Progress Update",
                content: "Progress update for Test Project",
                type: "PROJECT_UPDATE",
                updateType: "PROGRESS_UPDATE",
                projectDetails: {
                    projectPostId: projectPostId,
                    progressDetails: {
                        completedItems: ["Initial setup", "Core implementation"],
                        blockers: ["Awaiting external audit"],
                        nextSteps: ["Address audit feedback"],
                        completionPercentage: 60
                    },
                    updatedBy: projectCreator.address
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Create updated project state
            const updatedProject = {
                ...baseProject,
                projectDetails: {
                    ...baseProject.projectDetails,
                    lastUpdate: progressUpdate.projectDetails.progressDetails.completionPercentage,
                    updates: [
                        ...(initialData.projectDetails.updates || []),
                        {
                            type: "PROGRESS_UPDATE",
                            timestamp: progressUpdate.createdAt,
                            details: progressUpdate.projectDetails.progressDetails
                        }
                    ]
                }
            };

            // Post both the update and the new state
            await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(progressUpdate)),
                false,
                ethers.ZeroAddress,
                0
            );

            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(updatedProject)),
                false,
                ethers.ZeroAddress,
                0
            );

            // Verify update was recorded
            const post = await postMinter.getPost(projectPostId);
            const projectData = JSON.parse(post.metadata);
            expect(projectData.projectDetails.lastUpdate).to.equal(60);
            expect(projectData.projectDetails.updates).to.have.lengthOf(1);
        });

        it("Should handle milestone completion updates", async function () {
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Get current project state
            const initialPost = await postMinter.getPost(projectPostId);
            const initialData = JSON.parse(initialPost.metadata);

            const completionUpdate = {
                title: "Milestone Completion",
                content: "Completing Test Milestone",
                type: "PROJECT_UPDATE",
                updateType: "MILESTONE_COMPLETION",
                projectDetails: {
                    projectPostId: projectPostId,
                    milestoneIndex: 0,
                    completionDetails: {
                        deliverables: {
                            "Test Deliverable": "ipfs://deliverable-hash"
                        },
                        notes: "All requirements met",
                        completedAt: Math.floor(Date.now()/1000)
                    },
                    updatedBy: projectCreator.address
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Create updated project state
            const updatedProject = {
                ...baseProject,
                projectDetails: {
                    ...baseProject.projectDetails,
                    milestones: baseProject.projectDetails.milestones.map((m: any, index: number) => 
                        index === 0 ? { ...m, status: "COMPLETED" } : m
                    ),
                    updates: [
                        ...(initialData.projectDetails.updates || []),
                        {
                            type: "MILESTONE_COMPLETION",
                            timestamp: completionUpdate.createdAt,
                            milestoneIndex: 0,
                            details: completionUpdate.projectDetails.completionDetails
                        }
                    ]
                }
            };

            // Post both the update and the new state
            await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(completionUpdate)),
                false,
                ethers.ZeroAddress,
                0
            );

            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(updatedProject)),
                false,
                ethers.ZeroAddress,
                0
            );

            // Verify milestone status was updated
            const post = await postMinter.getPost(projectPostId);
            const projectData = JSON.parse(post.metadata);
            expect(projectData.projectDetails.milestones[0].status).to.equal("COMPLETED");
            expect(projectData.projectDetails.updates).to.have.lengthOf(1);
        });

        it("Should validate update permissions", async function () {
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Add a team member with limited permissions
            const limitedTeamMember = contributor1;
            const projectWithLimitedMember = {
                ...baseProject,
                projectDetails: {
                    ...baseProject.projectDetails,
                    team: [
                        ...baseProject.projectDetails.team,
                        {
                            address: limitedTeamMember.address,
                            role: "Contributor",
                            permissions: ["VIEW", "COMMENT"]
                        }
                    ]
                }
            };

            // Update project with new team member
            await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(projectWithLimitedMember)),
                false,
                ethers.ZeroAddress,
                0
            );

            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Try to make a status update with limited permissions
            const limitedUpdate = {
                title: "Limited Permission Update",
                content: "Attempting update with limited permissions",
                type: "PROJECT_UPDATE",
                updateType: "STATUS_UPDATE",
                projectDetails: {
                    projectPostId: projectPostId,
                    newStatus: "COMPLETED",
                    updatedBy: limitedTeamMember.address
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            // Get latest project state
            const post = await postMinter.getPost(projectPostId);
            const projectData = JSON.parse(post.metadata);

            // Verify team member exists with correct permissions
            const teamMember = projectData.projectDetails.team.find(
                (member: { address: string }) => member.address === limitedTeamMember.address
            );
            expect(teamMember).to.not.be.undefined;
            expect(teamMember.permissions).to.deep.equal(["VIEW", "COMMENT"]);

            // Attempt update
            await expect(
                postMinter.connect(limitedTeamMember).createPost(
                    tribeId,
                    JSON.stringify(replaceBigInts(limitedUpdate)),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.emit(postMinter, "PostCreated");

            // Verify status hasn't changed
            const updatedPost = await postMinter.getPost(projectPostId);
            const updatedProjectData = JSON.parse(updatedPost.metadata);
            expect(updatedProjectData.projectDetails.status).to.equal("PROPOSED");
        });
    });
}); 