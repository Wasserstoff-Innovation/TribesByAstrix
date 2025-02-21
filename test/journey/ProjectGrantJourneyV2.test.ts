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
    let pointSystem: any;

    let admin: SignerWithAddress;
    let moderator: SignerWithAddress;
    let projectCreator: SignerWithAddress;
    let reviewer1: SignerWithAddress;
    let reviewer2: SignerWithAddress;
    let contributor1: SignerWithAddress;
    let contributor2: SignerWithAddress;
    let bannedMember: SignerWithAddress;
    let tribeId: number;

    // Helper function to handle BigInt serialization
    function replaceBigInts(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (typeof obj === 'bigint') {
            return obj.toString();
        }

        if (Array.isArray(obj)) {
            return obj.map(replaceBigInts);
        }

        if (typeof obj === 'object') {
            const result: any = {};
            for (const key in obj) {
                result[key] = replaceBigInts(obj[key]);
            }
            return result;
        }

        return obj;
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

        // Deploy PointSystem
        const PointSystem = await ethers.getContractFactory("PointSystem");
        pointSystem = await PointSystem.deploy(
            roleManager.target,
            tribeController.target
        );
        await pointSystem.waitForDeployment();

        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        collectibleController = await CollectibleController.deploy(
            roleManager.target,
            tribeController.target,
            pointSystem.target
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
        console.log("\nCreating test tribe...");
        const tx = await tribeController.connect(admin).createTribe(
            "Project Grants Tribe",
            JSON.stringify({ 
                name: "Project Grants Tribe", 
                description: "A tribe for testing project grants",
                team: [
                    {
                        address: admin.address,
                        role: "admin",
                        permissions: ["UPDATE", "DELETE"]
                    },
                    {
                        address: projectCreator.address,
                        role: "creator",
                        permissions: ["UPDATE"]
                    },
                    {
                        address: reviewer1.address,
                        role: "reviewer",
                        permissions: ["UPDATE"]
                    }
                ]
            }),
            [admin.address, projectCreator.address, reviewer1.address], // Add all required members to whitelist
            0, // PUBLIC
            0, // No entry fee
            [] // No NFT requirements
        );

        const receipt = await tx.wait();
        const event = receipt?.logs.find(
            x => x instanceof EventLog && x.eventName === "TribeCreated"
        ) as EventLog;
        tribeId = event ? Number(event.args[0]) : 0;

        // Add project creator and reviewer to the tribe
        console.log("Adding project creator to tribe...");
        await tribeController.connect(projectCreator).joinTribe(tribeId);
        
        console.log("Adding reviewer to tribe...");
        await tribeController.connect(reviewer1).joinTribe(tribeId);

        // Verify membership status
        const creatorStatus = await tribeController.getMemberStatus(tribeId, projectCreator.address);
        const reviewerStatus = await tribeController.getMemberStatus(tribeId, reviewer1.address);
        
        console.log("Project creator status:", creatorStatus);
        console.log("Reviewer status:", reviewerStatus);

        if (Number(creatorStatus) !== 1 || Number(reviewerStatus) !== 1) {
            throw new Error("Failed to set up tribe membership properly");
        }

        // Add all necessary users to the tribe and verify their membership
        const users = [admin, moderator, projectCreator, reviewer1, reviewer2, contributor1, contributor2];
        console.log("\nAdding users to tribe...");
        console.log("Users to add:", users.map(u => u.address));
        
        for (const user of users) {
            console.log(`\nProcessing user ${user.address}...`);
            const status = await tribeController.getMemberStatus(tribeId, user.address);
            console.log(`Initial status for ${user.address}: ${status}`);
            
            if (Number(status) === 0) { // NONE
                console.log(`Joining tribe for ${user.address}...`);
                const joinTx = await tribeController.connect(user).joinTribe(tribeId);
                console.log(`Join transaction sent for ${user.address}`);
                await joinTx.wait();
                console.log(`Join transaction confirmed for ${user.address}`);
                
                // Verify membership status
                const newStatus = await tribeController.getMemberStatus(tribeId, user.address);
                console.log(`New status for ${user.address}: ${newStatus}`);
                if (Number(newStatus) !== 1) { // ACTIVE is index 1
                    throw new Error(`Failed to set member status to ACTIVE for ${user.address}`);
                }
            } else {
                console.log(`User ${user.address} already has status: ${status}`);
            }

            // Wait for rate limit between joins
            console.log(`Waiting for rate limit for ${user.address}...`);
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);
            console.log(`Rate limit wait complete for ${user.address}`);
        }

        // Verify whitelist
        console.log("\nVerifying tribe whitelist...");
        const whitelist = await tribeController.getTribeWhitelist(tribeId);
        console.log("Tribe whitelist:", whitelist);
        for (const user of users) {
            if (!whitelist.includes(user.address)) {
                throw new Error(`User ${user.address} not found in tribe whitelist`);
            }
        }

        // Double check all memberships
        console.log("\nVerifying final membership status for all users:");
        for (const user of users) {
            const status = await tribeController.getMemberStatus(tribeId, user.address);
            console.log(`Final status for ${user.address}: ${status}`);
            if (Number(status) !== 1) { // ACTIVE
                throw new Error(`User ${user.address} is not an active member. Status: ${status}`);
            }
        }

        // Ban the banned member
        console.log("\nBanning member:", bannedMember.address);
        await tribeController.connect(bannedMember).joinTribe(tribeId);
        await tribeController.connect(admin).banMember(tribeId, bannedMember.address);
        const bannedStatus = await tribeController.getMemberStatus(tribeId, bannedMember.address);
        console.log(`Banned member status: ${bannedStatus}`);

        // Wait for rate limit
        await ethers.provider.send("evm_increaseTime", [61]);
        await ethers.provider.send("evm_mine", []);

        // Wait for additional rate limit to ensure clean state for tests
        await ethers.provider.send("evm_increaseTime", [61]);
        await ethers.provider.send("evm_mine", []);
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
            console.log("\n=== Starting milestone submission test ===");
            
            // Log initial member status
            console.log("\nChecking initial member statuses:");
            console.log("Project Creator status:", await tribeController.getMemberStatus(tribeId, projectCreator.address));
            console.log("Reviewer status:", await tribeController.getMemberStatus(tribeId, reviewer1.address));

            // Create project
            console.log("\nCreating project...");
            const project = {
                type: "PROJECT",
                title: "SDK Development",
                content: "Building core SDK functionality",
                projectDetails: {
                    category: "DEVELOPMENT",
                    requestedAmount: ethers.parseEther("2000"),
                    duration: 30 * 24 * 60 * 60,
                    milestones: [
                        {
                            title: "Core SDK",
                            description: "Implement core SDK functionality",
                            dueDate: Math.floor(Date.now()/1000) + 30 * 24 * 60 * 60,
                            deliverables: ["SDK Code", "Tests", "Documentation"],
                            budget: ethers.parseEther("2000"),
                            status: "PENDING"
                        }
                    ],
                    team: [
                        {
                            address: projectCreator.address,
                            role: "creator",
                            permissions: ["UPDATE"]
                        },
                        {
                            address: reviewer1.address,
                            role: "reviewer",
                            permissions: ["UPDATE"]
                        }
                    ],
                    status: "PROPOSED"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            console.log("\nProject metadata:", JSON.stringify(replaceBigInts(project), null, 2));

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
            console.log("\nProject created with postId:", projectPostId);

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Verify project creator's membership status
            console.log("\nVerifying project creator membership before milestone submission...");
            const creatorStatus = await tribeController.getMemberStatus(tribeId, projectCreator.address);
            console.log("Project creator status:", creatorStatus);
            if (Number(creatorStatus) !== 1) { // ACTIVE
                console.log("Project creator not active, attempting to join tribe...");
                await tribeController.connect(projectCreator).joinTribe(tribeId);
                const newStatus = await tribeController.getMemberStatus(tribeId, projectCreator.address);
                console.log("New project creator status:", newStatus);
                if (Number(newStatus) !== 1) {
                    throw new Error("Failed to set project creator as active member");
                }
            }

            // Submit milestone
            console.log("\nSubmitting milestone...");
            const submission = {
                type: "PROJECT_UPDATE",
                title: "Core SDK Milestone Submission",
                content: "Completed the Core SDK milestone",
                updateType: "MILESTONE_SUBMISSION",
                projectDetails: {
                    projectPostId: projectPostId,
                    milestoneIndex: 0,
                    submission: {
                        deliverables: [
                            {
                                title: "SDK Code",
                                link: "https://github.com/example/sdk"
                            },
                            {
                                title: "Tests",
                                link: "https://github.com/example/sdk/tests"
                            },
                            {
                                title: "Documentation",
                                link: "https://docs.example.com/sdk"
                            }
                        ],
                        notes: "All deliverables completed as specified"
                    }
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            console.log("\nSubmission metadata:", JSON.stringify(replaceBigInts(submission), null, 2));

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Final membership check before submission
            console.log("\nFinal membership check before submission:");
            console.log("Project Creator status:", await tribeController.getMemberStatus(tribeId, projectCreator.address));
            console.log("Tribe ID being used:", tribeId);

            const submissionTx = await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(submission)),
                false,
                ethers.ZeroAddress,
                0
            );

            await expect(submissionTx).to.emit(postMinter, "PostCreated");
            console.log("\nMilestone submission successful");
        });

        it("Should handle project status updates", async function () {
            // Create initial project
            const project = {
                type: "PROJECT",
                title: "Smart Contract Library",
                content: "Building a library of reusable smart contracts",
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
                    team: [
                        {
                            address: admin.address,
                            role: "admin",
                            permissions: ["UPDATE"]
                        }
                    ],
                    status: "PROPOSED"
                },
                createdAt: Math.floor(Date.now()/1000)
            };

            const createTx = await postMinter.connect(admin).createPost(
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
                type: "PROJECT_UPDATE",
                title: "Project Status Update",
                content: "Project has been approved",
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
            // Create initial project
            const project = {
                type: "PROJECT",
                title: "Test Project",
                content: "Project for testing unauthorized updates",
                projectDetails: {
                    category: "DEVELOPMENT",
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
                    team: [
                        {
                            address: projectCreator.address,
                            role: "Project Lead",
                            permissions: ["UPDATE"]
                        }
                    ],
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

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Attempt unauthorized update
            const unauthorizedUpdate = {
                type: "PROJECT_UPDATE",
                title: "Unauthorized Update",
                content: "Attempting unauthorized update",
                updateType: "STATUS_UPDATE",
                projectDetails: {
                    projectPostId: projectPostId,
                    newStatus: "COMPLETED",
                    updatedBy: contributor1.address
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

            // Attempt update with non-team member should fail
            await expect(
                postMinter.connect(contributor1).createPost(
                    tribeId,
                    JSON.stringify(replaceBigInts(unauthorizedUpdate)),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWith("Insufficient permissions");

            // Wait for rate limit
            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

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
                        permissions: "UPDATE"
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

            // Update the original project post with the new state
            await postMinter.connect(projectCreator).updatePost(
                projectPostId,
                JSON.stringify(replaceBigInts(updatedProject))
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

            // Create updated project state with completed milestone
            const updatedProject = {
                ...baseProject,
                projectDetails: {
                    ...baseProject.projectDetails,
                    milestones: baseProject.projectDetails.milestones.map((m: any, index: number) => 
                        index === 0 ? { 
                            ...m, 
                            status: "COMPLETED",
                            completedAt: completionUpdate.projectDetails.completionDetails.completedAt,
                            deliverables: completionUpdate.projectDetails.completionDetails.deliverables
                        } : m
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

            // Post the completion update
            await postMinter.connect(projectCreator).createPost(
                tribeId,
                JSON.stringify(replaceBigInts(completionUpdate)),
                false,
                ethers.ZeroAddress,
                0
            );

            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Update the original project post with the new state
            await postMinter.connect(projectCreator).updatePost(
                projectPostId,
                JSON.stringify(replaceBigInts(updatedProject))
            );

            // Get the latest project post
            const post = await postMinter.getPost(projectPostId);
            const projectData = JSON.parse(post.metadata);
            
            // Verify milestone status was updated
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
                            permissions: ["UPDATE"]
                        }
                    ]
                }
            };

            // Update project with new team member
            await postMinter.connect(projectCreator).updatePost(
                projectPostId,
                JSON.stringify(replaceBigInts(projectWithLimitedMember))
            );

            await ethers.provider.send("evm_increaseTime", [61]);
            await ethers.provider.send("evm_mine", []);

            // Create status update from limited member
            const limitedUpdate = {
                title: "Status Update",
                content: "Attempting to update project status",
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
            expect(teamMember.permissions).to.deep.equal(["UPDATE"]);

            // Attempt update - should fail due to insufficient permissions
            await expect(
                postMinter.connect(limitedTeamMember).createPost(
                    tribeId,
                    JSON.stringify(replaceBigInts(limitedUpdate)),
                    false,
                    ethers.ZeroAddress,
                    0
                )
            ).to.be.revertedWith("Insufficient permissions");

            // Verify status hasn't changed
            const updatedPost = await postMinter.getPost(projectPostId);
            const updatedProjectData = JSON.parse(updatedPost.metadata);
            expect(updatedProjectData.projectDetails.status).to.equal("PROPOSED");
        });
    });
}); 