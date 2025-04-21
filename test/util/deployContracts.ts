// SPDX-License-Identifier: MIT
import { ethers, upgrades } from "hardhat";
import { 
    RoleManager, 
    TribeController, 
    PointSystem, 
    CollectibleController,
    PostFeedManager, 
    PostMinter 
} from "../../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Signer } from "ethers";

/**
 * Deploy test contracts using the upgradeable pattern that matches the main deployment scripts
 */
export async function deployContracts() {
    const [owner, admin, contentCreator, moderator, regularUser1, regularUser2, bannedUser] = await ethers.getSigners();
    
    try {
        // Deploy RoleManager with proxy - using proxy is more reliable since we know it works
        const RoleManager = await ethers.getContractFactory("RoleManager");
        const roleManager = await upgrades.deployProxy(RoleManager, [], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await roleManager.waitForDeployment();
        const roleManagerAddress = await roleManager.getAddress();
        console.log("RoleManager deployed");
        
        // Deploy TribeController with proxy
        const TribeController = await ethers.getContractFactory("TribeController");
        const tribeController = await upgrades.deployProxy(TribeController, [roleManagerAddress], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await tribeController.waitForDeployment();
        const tribeControllerAddress = await tribeController.getAddress();
        console.log("TribeController deployed");
        
        // Deploy PointSystem with proxy
        const PointSystem = await ethers.getContractFactory("PointSystem");
        const pointSystem = await upgrades.deployProxy(PointSystem, [
            roleManagerAddress,
            tribeControllerAddress
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await pointSystem.waitForDeployment();
        const pointSystemAddress = await pointSystem.getAddress();
        console.log("PointSystem deployed");
        
        // Deploy CollectibleController with proxy
        const CollectibleController = await ethers.getContractFactory("CollectibleController");
        const collectibleController = await upgrades.deployProxy(CollectibleController, [
            roleManagerAddress,
            tribeControllerAddress,
            pointSystemAddress
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await collectibleController.waitForDeployment();
        const collectibleControllerAddress = await collectibleController.getAddress();
        console.log("CollectibleController deployed");
        
        // Deploy PostFeedManager as a regular contract (not upgradeable since it has no initialize method)
        const PostFeedManager = await ethers.getContractFactory("PostFeedManager");
        const feedManager = await PostFeedManager.deploy(tribeControllerAddress);
        await feedManager.waitForDeployment();
        const feedManagerAddress = await feedManager.getAddress();
        console.log("PostFeedManager deployed");

        // Deploy PostMinter with proxy
        console.log("Deploying PostMinter...");
        const PostMinter = await ethers.getContractFactory("PostMinter");
        const postMinter = await upgrades.deployProxy(PostMinter, [
            roleManagerAddress,
            tribeControllerAddress,
            collectibleControllerAddress,
            feedManagerAddress
        ], { 
            kind: 'uups',
            unsafeAllow: ['constructor'] 
        });
        await postMinter.waitForDeployment();
        console.log("PostMinter deployed");
        
        // Grant admin role to PostMinter in PostFeedManager
        try {
            await feedManager.grantRole(await feedManager.DEFAULT_ADMIN_ROLE(), await postMinter.getAddress());
        } catch (error) {
            console.error("Error granting role to PostMinter in PostFeedManager:", error);
        }
        
        // Setup initial roles for testing
        await setupRoles(roleManager as RoleManager, postMinter as PostMinter, admin, contentCreator, moderator, owner, regularUser1, regularUser2);
        
        return {
            signers: {
                owner,
                admin,
                contentCreator,
                moderator,
                regularUser1,
                regularUser2,
                bannedUser
            },
            contracts: {
                roleManager: roleManager as RoleManager,
                tribeController: tribeController as TribeController,
                pointSystem: pointSystem as PointSystem,
                collectibleController: collectibleController as CollectibleController,
                feedManager: feedManager as PostFeedManager,
                postMinter: postMinter as PostMinter
            }
        };
    } catch (error) {
        console.error("Error in deployContracts:", error);
        throw error;
    }
}

export async function setupRoles(
    roleManager: RoleManager,
    postMinter: PostMinter,
    admin: SignerWithAddress,
    contentCreator: SignerWithAddress,
    moderator: SignerWithAddress,
    owner: SignerWithAddress,
    regularUser1?: SignerWithAddress,
    regularUser2?: SignerWithAddress
) {
    // Setup roles in RoleManager
    try {
        await roleManager.grantRole(await roleManager.DEFAULT_ADMIN_ROLE(), admin.address);
    } catch (error) {
        console.error("Failed to grant DEFAULT_ADMIN_ROLE:", error);
    }
    
    // Setup common roles
    const adminRoleHash = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const moderatorRoleHash = ethers.keccak256(ethers.toUtf8Bytes("MODERATOR_ROLE"));
    const contentCreatorRoleHash = ethers.keccak256(ethers.toUtf8Bytes("CONTENT_CREATOR_ROLE"));
    const projectCreatorRoleHash = ethers.keccak256(ethers.toUtf8Bytes("PROJECT_CREATOR_ROLE"));
    const fanRoleHash = ethers.keccak256(ethers.toUtf8Bytes("FAN_ROLE"));
    const organizerRoleHash = ethers.keccak256(ethers.toUtf8Bytes("ORGANIZER_ROLE"));
    
    // Grant roles in RoleManager
    try {
        await roleManager.grantRole(adminRoleHash, admin.address);
        await roleManager.grantRole(moderatorRoleHash, moderator.address);
        await roleManager.grantRole(contentCreatorRoleHash, contentCreator.address);
        await roleManager.grantRole(projectCreatorRoleHash, contentCreator.address);
        
        // Grant these roles to the owner as well for testing flexibility
        await roleManager.grantRole(adminRoleHash, owner.address);
        await roleManager.grantRole(moderatorRoleHash, owner.address);
        await roleManager.grantRole(contentCreatorRoleHash, owner.address);
        await roleManager.grantRole(projectCreatorRoleHash, owner.address);
        await roleManager.grantRole(fanRoleHash, owner.address);
        await roleManager.grantRole(organizerRoleHash, owner.address);
        
        // Grant PROJECT_CREATOR_ROLE to regular users for testing if they are provided
        if (regularUser1) {
            await roleManager.grantRole(projectCreatorRoleHash, regularUser1.address);
        }
        if (regularUser2) {
            await roleManager.grantRole(projectCreatorRoleHash, regularUser2.address);
        }
    } catch (error) {
        console.error("Failed to grant common roles:", error);
    }
    
    // Setup roles in PostMinter
    try {
        // Get the role constants
        const projectCreatorRole = await postMinter.PROJECT_CREATOR_ROLE();
        const rateLimitRole = await postMinter.RATE_LIMIT_MANAGER_ROLE();
        
        await postMinter.grantRole(await postMinter.DEFAULT_ADMIN_ROLE(), admin.address);
        
        // Grant project creator role
        await postMinter.grantRole(projectCreatorRole, contentCreator.address);
        await postMinter.grantRole(projectCreatorRole, admin.address);
        await postMinter.grantRole(projectCreatorRole, owner.address);
        
        if (regularUser1) {
            await postMinter.grantRole(projectCreatorRole, regularUser1.address);
        }
        if (regularUser2) {
            await postMinter.grantRole(projectCreatorRole, regularUser2.address);
        }
        
        // Grant rate limit manager role to bypass cooldowns
        await postMinter.grantRole(rateLimitRole, contentCreator.address);
        await postMinter.grantRole(rateLimitRole, admin.address);
        await postMinter.grantRole(rateLimitRole, owner.address);
        await postMinter.grantRole(rateLimitRole, moderator.address);
        
        if (regularUser1) {
            await postMinter.grantRole(rateLimitRole, regularUser1.address);
        }
        if (regularUser2) {
            await postMinter.grantRole(rateLimitRole, regularUser2.address);
        }
    } catch (error) {
        console.error("Error setting up PostMinter roles:", error);
    }
    
    // Register all signers as fans for basic access
    try {
        await roleManager.assignRole(owner.address, fanRoleHash);
        await roleManager.assignRole(admin.address, fanRoleHash);
        await roleManager.assignRole(contentCreator.address, fanRoleHash);
        await roleManager.assignRole(moderator.address, fanRoleHash);
        
        if (regularUser1) {
            await roleManager.assignRole(regularUser1.address, fanRoleHash);
        }
        if (regularUser2) {
            await roleManager.assignRole(regularUser2.address, fanRoleHash);
        }
    } catch (error) {
        console.error("Failed to assign fan roles:", error);
    }
} 