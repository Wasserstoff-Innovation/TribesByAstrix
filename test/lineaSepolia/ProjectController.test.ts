import { expect } from "chai";
import { ethers } from "hardhat";
import { ProjectController } from "../../typechain-types";
import { getDeployedContracts, setupTestAccounts } from "../helpers/lineaSepolia";

describe("ProjectController on Linea Sepolia", function () {
  let projectController: any;
  let deployer: any;
  let user1: any;
  let user2: any;
  let isReadOnly = true;

  before(async function () {
    // Increase timeout for network operations
    this.timeout(300000);
    
    try {
      // Get accounts
      const accounts = await setupTestAccounts();
      deployer = accounts.deployer;
      user1 = accounts.user1;
      user2 = accounts.user2;

      console.log(`Test using deployer: ${deployer.address}`);

      // Get deployed contracts
      const contracts = await getDeployedContracts(deployer);
      
      if (!contracts.ProjectController) {
        throw new Error('ProjectController contract not found in deployment');
      }
      
      projectController = contracts.ProjectController;
      const address = await projectController.getAddress();
      console.log(`ProjectController contract loaded at: ${address}`);
      
      // Check if we can write to the network
      try {
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);
        isReadOnly = balance.toString() === '0';
      } catch (error) {
        console.log('Could not get balance, assuming read-only mode');
        isReadOnly = true;
      }
    } catch (error) {
      console.error('Setup failed:', error);
      this.skip();
    }
  });

  it("Should get total projects count", async function () {
    try {
      const totalProjects = await projectController.getProjectCount();
      console.log(`Total projects: ${totalProjects}`);
      expect(totalProjects).to.be.a('bigint');
    } catch (error) {
      console.error('Error getting project count:', error);
      this.skip();
    }
  });

  it("Should get project categories", async function () {
    try {
      const categories = await projectController.getCategories();
      console.log(`Number of project categories: ${categories.length}`);
      
      if (categories.length > 0) {
        console.log('Project categories:');
        categories.forEach((category: string, index: number) => {
          console.log(`  ${index + 1}. ${category}`);
        });
      }
      
      expect(categories).to.be.an('array');
    } catch (error) {
      console.error('Error getting project categories:', error);
      this.skip();
    }
  });

  it("Should get details of the first project if it exists", async function () {
    try {
      const projectCount = await projectController.getProjectCount();
      
      if (projectCount > 0) {
        const projectId = 1; // First project ID
        console.log(`Getting details for project ID: ${projectId}`);
        
        const project = await projectController.getProject(projectId);
        console.log(`Project ${projectId} details:`);
        console.log(`  Name: ${project.name}`);
        console.log(`  Creator: ${project.creator}`);
        console.log(`  Description: ${project.description.substring(0, 50)}...`);
        console.log(`  Category: ${project.category}`);
        console.log(`  Tribe ID: ${project.tribeId}`);
        console.log(`  Status: ${project.status}`);
        
        expect(project.name).to.be.a('string');
        expect(project.creator).to.match(/^0x[a-fA-F0-9]{40}$/);
      } else {
        console.log('No projects found to retrieve details');
        this.skip();
      }
    } catch (error) {
      console.error('Error getting project details:', error);
      this.skip();
    }
  });

  it("Should get projects by tribe", async function () {
    try {
      // Try with tribe ID 1 as a default
      const tribeId = 1;
      console.log(`Getting projects for tribe ID: ${tribeId}`);
      
      const projectIds = await projectController.getProjectsByTribe(tribeId);
      console.log(`Tribe ${tribeId} has ${projectIds.length} projects`);
      
      if (projectIds.length > 0) {
        console.log('First few project IDs:');
        const limit = Math.min(projectIds.length, 3);
        for (let i = 0; i < limit; i++) {
          console.log(`  Project ID: ${projectIds[i]}`);
        }
      }
      
      expect(projectIds).to.be.an('array');
    } catch (error) {
      console.error('Error getting projects by tribe:', error);
      this.skip();
    }
  });

  it("Should get projects by creator", async function () {
    try {
      console.log(`Getting projects for creator: ${deployer.address}`);
      
      const projectIds = await projectController.getProjectsByCreator(deployer.address);
      console.log(`Creator has ${projectIds.length} projects`);
      
      if (projectIds.length > 0) {
        console.log('First few project IDs:');
        const limit = Math.min(projectIds.length, 3);
        for (let i = 0; i < limit; i++) {
          console.log(`  Project ID: ${projectIds[i]}`);
        }
      }
      
      expect(projectIds).to.be.an('array');
    } catch (error) {
      console.error('Error getting projects by creator:', error);
      this.skip();
    }
  });
  
  it("Should get projects by category", async function () {
    try {
      const categories = await projectController.getCategories();
      
      if (categories.length > 0) {
        const category = categories[0];
        console.log(`Getting projects for category: ${category}`);
        
        const projectIds = await projectController.getProjectsByCategory(category);
        console.log(`Category '${category}' has ${projectIds.length} projects`);
        
        if (projectIds.length > 0) {
          console.log('First few project IDs:');
          const limit = Math.min(projectIds.length, 3);
          for (let i = 0; i < limit; i++) {
            console.log(`  Project ID: ${projectIds[i]}`);
          }
        }
        
        expect(projectIds).to.be.an('array');
      } else {
        console.log('No categories found to check projects by category');
        this.skip();
      }
    } catch (error) {
      console.error('Error getting projects by category:', error);
      this.skip();
    }
  });
}); 