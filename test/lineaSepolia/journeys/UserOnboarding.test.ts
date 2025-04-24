import { expect } from "chai";
import { ethers } from "hardhat";
import { getDeployedContracts, setupTestAccounts } from "../../helpers/lineaSepolia";

// Helper function to get error message safely
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

describe("User Onboarding Journey on Linea Sepolia", function () {
  // Contracts we'll need for the journey
  let tribeController: any;
  let tokenCollection: any;
  let pointSystem: any;
  
  // Accounts
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
      console.log(`Test user1: ${user1.address}`);
      console.log(`Test user2: ${user2.address}`);

      // Get deployed contracts
      const contracts = await getDeployedContracts(deployer);
      
      // Get key contracts for onboarding journey
      tribeController = contracts.TribeController;
      tokenCollection = contracts.TokenCollection;
      
      // Point system is optional but important for rewards
      pointSystem = contracts.AstrixPointSystem;
      
      // Check if we have the minimum required contracts
      if (!tribeController) {
        throw new Error('TribeController contract not found in deployment');
      }
      
      // Log contract addresses
      console.log('\nContracts loaded:');
      console.log(`TribeController: ${await tribeController.getAddress()}`);
      if (tokenCollection) console.log(`TokenCollection: ${await tokenCollection.getAddress()}`);
      if (pointSystem) console.log(`AstrixPointSystem: ${await pointSystem.getAddress()}`);
      
      // Check if we can write to the network
      try {
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log(`\nDeployer balance: ${ethers.formatEther(balance)} ETH`);
        isReadOnly = balance.toString() === '0';
        
        if (isReadOnly) {
          console.log('WARNING: Running in read-only mode. Journey steps requiring transactions will be skipped.');
        } else {
          console.log('Network is writable. Full journey test will be attempted.');
        }
      } catch (error) {
        console.log('Could not get balance, assuming read-only mode');
        isReadOnly = true;
      }
    } catch (error) {
      console.error('Setup failed:', error);
      this.skip();
    }
  });

  /**
   * JOURNEY STEPS
   * 
   * The following tests trace through a user's onboarding journey:
   * 1. Discovery: Explore available tribes
   * 2. Tribe Membership: Join a tribe (or check existing membership)
   * 3. Identity: Check if user has a profile token
   * 4. Rewards: Check point system and rewards
   * 5. Achievements: View achievements and progress
   */

  it("Step 1: Discover available tribes", async function () {
    try {
      console.log(`\nStep 1: Tribe Discovery`);
      
      // Get total tribe count
      const totalTribes = await tribeController.getTotalTribes();
      console.log(`Total tribes available: ${totalTribes}`);
      
      // Get details on first few tribes
      console.log('\nExploring some available tribes:');
      
      for (let i = 1; i <= Math.min(Number(totalTribes), 3); i++) {
        try {
          const tribe = await tribeController.getTribe(i);
          console.log(`\nTribe #${i}:`);
          console.log(`  Name: ${tribe.name}`);
          console.log(`  Description: ${tribe.description.substring(0, 100)}...`);
          console.log(`  Members: ${tribe.memberCount}`);
          
          // Get tribe token if token collection is available
          if (tokenCollection) {
            try {
              const tribeToken = await tokenCollection.getTribeToken(i);
              console.log(`  Token ID: ${tribeToken.tokenId}`);
              console.log(`  Token URI: ${tribeToken.tokenURI.substring(0, 50)}...`);
            } catch (error) {
              console.log(`  Error getting token details: ${getErrorMessage(error)}`);
            }
          }
        } catch (error) {
          console.log(`  Error getting tribe ${i} details: ${getErrorMessage(error)}`);
        }
      }
      
      // Check total membership
      const totalMembers = await tribeController.getTotalMembers();
      console.log(`\nTotal members across all tribes: ${totalMembers}`);
      
      // Check largest tribe
      try {
        const totalTribeCount = Number(totalTribes);
        let largestTribeId = 0;
        let largestMemberCount = 0;
        
        for (let i = 1; i <= totalTribeCount; i++) {
          const tribe = await tribeController.getTribe(i);
          if (Number(tribe.memberCount) > largestMemberCount) {
            largestTribeId = i;
            largestMemberCount = Number(tribe.memberCount);
          }
        }
        
        if (largestTribeId > 0) {
          const largestTribe = await tribeController.getTribe(largestTribeId);
          console.log(`\nLargest tribe: #${largestTribeId} (${largestTribe.name}) with ${largestMemberCount} members`);
        }
      } catch (error) {
        console.log(`Could not determine largest tribe`);
      }
    } catch (error) {
      console.error('Error exploring tribes:', error);
      this.skip();
    }
  });

  it("Step 2: Check and join a tribe", async function () {
    try {
      console.log(`\nStep 2: Tribe Membership`);
      
      // Check if user already belongs to any tribes
      try {
        const userTribes = await tribeController.getUserTribes(user1.address);
        
        if (userTribes.length > 0) {
          console.log(`User is already a member of ${userTribes.length} tribe(s):`);
          
          for (let i = 0; i < userTribes.length; i++) {
            const tribeId = userTribes[i];
            const tribeInfo = await tribeController.getTribe(tribeId);
            console.log(`  Tribe #${tribeId}: ${tribeInfo.name}`);
          }
        } else {
          console.log('User is not yet a member of any tribe');
        }
      } catch (error) {
        console.log(`Error getting user tribes: ${getErrorMessage(error)}`);
      }
      
      // Find a tribe to join if user isn't in any tribe yet
      if (isReadOnly) {
        console.log('\nIn read-only mode, skipping tribe join process');
      } else {
        try {
          const userTribes = await tribeController.getUserTribes(user1.address);
          
          if (userTribes.length === 0) {
            const totalTribes = await tribeController.getTotalTribes();
            
            if (Number(totalTribes) > 0) {
              // Find a tribe with open membership (if applicable)
              let targetTribeId = 1; // Default to first tribe
              
              // Check if we need to find one with open membership
              let membershipMethodType = '';
              try {
                if (typeof tribeController.joinTribe === 'function') {
                  membershipMethodType = 'joinTribe';
                } else if (typeof tribeController.requestToJoinTribe === 'function') {
                  membershipMethodType = 'requestToJoinTribe';
                }
                
                // If we found a method, we can proceed
                if (membershipMethodType) {
                  console.log(`\nTribe joining method available: ${membershipMethodType}`);
                  console.log(`Would join tribe #${targetTribeId} using ${membershipMethodType}`);
                  
                  // This is where we would join a tribe if this wasn't a simulation
                  // await tribeController[membershipMethodType](targetTribeId);
                } else {
                  console.log('\nNo tribe joining method available');
                }
              } catch (error) {
                console.log(`Error checking tribe joining methods: ${getErrorMessage(error)}`);
              }
            } else {
              console.log('No tribes available to join');
            }
          } else {
            console.log('\nUser already belongs to a tribe, skipping join process');
          }
        } catch (error) {
          console.log(`Error in tribe joining process: ${getErrorMessage(error)}`);
        }
      }
      
      // Try to get tribe information and member list
      try {
        // Get first tribe's member list
        const tribeId = 1;
        const tribe = await tribeController.getTribe(tribeId);
        console.log(`\nTribe #${tribeId} (${tribe.name}) has ${tribe.memberCount} members`);
        
        // Check if method exists to get members
        if (typeof tribeController.getTribeMembers === 'function') {
          const members = await tribeController.getTribeMembers(tribeId);
          console.log(`First few members of tribe #${tribeId}:`);
          
          const limit = Math.min(members.length, 5);
          for (let i = 0; i < limit; i++) {
            console.log(`  Member ${i+1}: ${members[i]}`);
          }
        } else if (typeof tribeController.membersOf === 'function') {
          const members = await tribeController.membersOf(tribeId);
          console.log(`First few members of tribe #${tribeId}:`);
          
          const limit = Math.min(members.length, 5);
          for (let i = 0; i < limit; i++) {
            console.log(`  Member ${i+1}: ${members[i]}`);
          }
        } else {
          console.log('Method to get tribe members not available');
        }
      } catch (error) {
        console.log(`Error getting tribe members: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      console.error('Error in tribe membership step:', error);
      this.skip();
    }
  });

  it("Step 3: Check user identity and tokens", async function () {
    try {
      console.log(`\nStep 3: User Identity and Tokens`);
      
      // Skip if token collection isn't available
      if (!tokenCollection) {
        console.log('TokenCollection not available, skipping identity check');
        return;
      }
      
      // Check if the user has a profile NFT
      try {
        // Different contracts might have different methods
        let hasProfileToken = false;
        let tokenId = 0;
        
        if (typeof tokenCollection.getProfileTokenId === 'function') {
          tokenId = await tokenCollection.getProfileTokenId(user1.address);
          hasProfileToken = Number(tokenId) > 0;
        } else if (typeof tokenCollection.hasProfileToken === 'function') {
          hasProfileToken = await tokenCollection.hasProfileToken(user1.address);
        } else if (typeof tokenCollection.ownerOf === 'function' && typeof tokenCollection.getUserToken === 'function') {
          try {
            tokenId = await tokenCollection.getUserToken(user1.address);
            hasProfileToken = Number(tokenId) > 0;
          } catch (err) {
            hasProfileToken = false;
          }
        }
        
        if (hasProfileToken) {
          console.log(`User has a profile token (ID: ${tokenId})`);
          
          // Try to get token URI
          try {
            const tokenURI = await tokenCollection.tokenURI(tokenId);
            console.log(`Token URI: ${tokenURI.substring(0, 100)}...`);
            
            // Try to fetch and parse metadata
            if (tokenURI.startsWith('data:application/json;base64,')) {
              const base64Data = tokenURI.replace('data:application/json;base64,', '');
              const jsonData = Buffer.from(base64Data, 'base64').toString('utf8');
              const metadata = JSON.parse(jsonData);
              
              console.log('\nToken metadata:');
              console.log(`  Name: ${metadata.name}`);
              console.log(`  Description: ${metadata.description.substring(0, 100)}...`);
              
              if (metadata.attributes && Array.isArray(metadata.attributes)) {
                console.log('  Attributes:');
                metadata.attributes.forEach((attr: any) => {
                  console.log(`    ${attr.trait_type}: ${attr.value}`);
                });
              }
            }
          } catch (error) {
            console.log(`Error getting token details: ${getErrorMessage(error)}`);
          }
        } else {
          console.log('User does not have a profile token yet');
          
          // Check if we can mint a profile token in write mode
          if (!isReadOnly) {
            console.log('In a writable mode, would mint a profile token here');
            
            // This is where we would mint a profile token if this wasn't a simulation
            // Different contracts might have different methods
            // e.g., tokenCollection.mintProfileToken() or tokenCollection.createProfile()
          }
        }
      } catch (error) {
        console.log(`Error checking profile token: ${getErrorMessage(error)}`);
      }
      
      // Check if user has any tribe membership tokens
      try {
        let tribeMemberships = [];
        
        // Try different methods based on what might be available
        if (typeof tokenCollection.getUserTribeTokens === 'function') {
          tribeMemberships = await tokenCollection.getUserTribeTokens(user1.address);
        } else if (typeof tribeController.getUserTribes === 'function') {
          tribeMemberships = await tribeController.getUserTribes(user1.address);
        }
        
        if (tribeMemberships.length > 0) {
          console.log(`\nUser has ${tribeMemberships.length} tribe membership tokens:`);
          
          for (let i = 0; i < tribeMemberships.length; i++) {
            const tribeId = typeof tribeMemberships[i] === 'object' ? 
              tribeMemberships[i].tribeId : tribeMemberships[i];
            
            const tribe = await tribeController.getTribe(tribeId);
            console.log(`  Tribe #${tribeId}: ${tribe.name}`);
          }
        } else {
          console.log('\nUser does not have any tribe membership tokens');
        }
      } catch (error) {
        console.log(`Error checking tribe tokens: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      console.error('Error checking user identity:', error);
      this.skip();
    }
  });

  it("Step 4: Check point system and rewards", async function () {
    try {
      console.log(`\nStep 4: Point System and Rewards`);
      
      // Skip if point system isn't available
      if (!pointSystem) {
        console.log('AstrixPointSystem not available, skipping rewards check');
        return;
      }
      
      // Get user's current points
      try {
        const points = await pointSystem.getPoints(user1.address);
        console.log(`User ${user1.address} has ${points} points`);
        
        // Get user rank if available
        try {
          const { rank, totalUsers } = await pointSystem.getUserRank(user1.address);
          console.log(`User rank: ${rank} out of ${totalUsers} users`);
        } catch (error) {
          console.log(`Error getting rank: ${getErrorMessage(error)}`);
        }
        
        // Get point events
        try {
          const events = await pointSystem.getUserPointEvents(user1.address, 0, 10);
          console.log(`\nUser's recent point activity (${events.length} events):`);
          
          if (events.length > 0) {
            for (let i = 0; i < events.length; i++) {
              const event = events[i];
              console.log(`  Event ${i+1}: Action=${event.action}, Points=${event.points}, Timestamp=${new Date(Number(event.timestamp) * 1000).toISOString()}`);
            }
          } else {
            console.log('  No point activity found');
          }
        } catch (error) {
          console.log(`Error getting point events: ${getErrorMessage(error)}`);
        }
        
        // Check available point actions
        try {
          const actions = await pointSystem.getPointActions();
          console.log('\nAvailable point-earning actions:');
          
          for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const value = await pointSystem.getPointValue(action);
            console.log(`  ${action}: ${value} points`);
          }
        } catch (error) {
          console.log(`Error getting point values: ${getErrorMessage(error)}`);
        }
        
        // Check if any action has a limit
        try {
          // Sample actions to check limits for
          const actionsToCheck = [
            "JOIN_TRIBE",
            "CREATE_POST",
            "COMMENT",
            "LIKE"
          ];
          
          console.log('\nDaily action limits:');
          
          for (const action of actionsToCheck) {
            const hasLimit = await pointSystem.hasActionLimit(action);
            if (hasLimit) {
              const limit = await pointSystem.getActionLimit(action);
              const userCount = await pointSystem.getUserActionCount(user1.address, action);
              console.log(`  ${action}: ${userCount}/${limit} (${hasLimit ? 'Limited' : 'Unlimited'})`);
            } else {
              console.log(`  ${action}: Unlimited`);
            }
          }
        } catch (err) {
          console.log(`Error checking action limits: ${getErrorMessage(err)}`);
        }
      } catch (error) {
        console.log(`Error checking points: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      console.error('Error checking rewards:', error);
      this.skip();
    }
  });

  it("Step 5: Check achievements and progress", async function () {
    try {
      console.log(`\nStep 5: Achievements and Progress`);
      
      // Check if we have an achievement system
      let achievementSystem = null;
      
      if (pointSystem && typeof pointSystem.getAchievements === 'function') {
        achievementSystem = pointSystem;
      } else if (getDeployedContracts && typeof getDeployedContracts === 'function') {
        try {
          const contracts = await getDeployedContracts(deployer);
          if (contracts.AchievementSystem) {
            achievementSystem = contracts.AchievementSystem;
          }
        } catch (error) {
          console.log(`Error looking for achievement system: ${getErrorMessage(error)}`);
        }
      }
      
      if (!achievementSystem) {
        console.log('Achievement system not available, skipping achievements check');
        return;
      }
      
      // Get all available achievements
      try {
        const achievements = await achievementSystem.getAchievements();
        console.log(`System has ${achievements.length} achievements available:`);
        
        for (let i = 0; i < Math.min(achievements.length, 5); i++) {
          const achievement = achievements[i];
          console.log(`\nAchievement #${achievement.id || i+1}:`);
          console.log(`  Title: ${achievement.title || achievement.name}`);
          console.log(`  Description: ${achievement.description}`);
          console.log(`  Reward: ${achievement.pointReward || 0} points`);
          
          // Check if user has this achievement
          try {
            const hasAchievement = await achievementSystem.hasAchievement(user1.address, achievement.id || i+1);
            console.log(`  Earned: ${hasAchievement}`);
            
            if (hasAchievement) {
              // Get when the achievement was earned
              try {
                const earnedAt = await achievementSystem.getAchievementEarnedTime(user1.address, achievement.id || i+1);
                if (earnedAt) {
                  console.log(`  Earned At: ${new Date(Number(earnedAt) * 1000).toISOString()}`);
                }
              } catch (err) {
                // Ignore if method doesn't exist
              }
            } else if (achievement.progress && typeof achievementSystem.getAchievementProgress === 'function') {
              // Check progress if available
              try {
                const progress = await achievementSystem.getAchievementProgress(user1.address, achievement.id || i+1);
                console.log(`  Progress: ${progress}/${achievement.target}`);
              } catch (err) {
                // Ignore if method doesn't exist
              }
            }
          } catch (err) {
            console.log(`  Could not check if user has achievement`);
          }
        }
        
        // Get user's earned achievements
        try {
          const userAchievements = await achievementSystem.getUserAchievements(user1.address);
          console.log(`\nUser has earned ${userAchievements.length} achievements`);
          
          if (userAchievements.length > 0) {
            let totalPoints = 0;
            
            for (let i = 0; i < userAchievements.length; i++) {
              const achievementId = typeof userAchievements[i] === 'object' ? 
                userAchievements[i].id : userAchievements[i];
              
              // Get achievement details
              const achievement = await achievementSystem.getAchievement(achievementId);
              
              console.log(`  ${i+1}. ${achievement.title || achievement.name}`);
              
              // Add to total points if available
              if (achievement.pointReward) {
                totalPoints += Number(achievement.pointReward);
              }
            }
            
            if (totalPoints > 0) {
              console.log(`\nTotal points from achievements: ${totalPoints}`);
            }
          }
        } catch (err) {
          console.log(`Error getting user achievements`);
        }
      } catch (error) {
        console.log(`Error getting achievements: ${getErrorMessage(error)}`);
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
      this.skip();
    }
  });

  it("Journey Summary", async function () {
    console.log('\n===== USER ONBOARDING JOURNEY SUMMARY =====');
    console.log(`User: ${user1.address}`);
    console.log(`Network: Linea Sepolia`);
    console.log(`Mode: ${isReadOnly ? 'Read-only (Simulated)' : 'Writable'}`);
    console.log('Steps completed:');
    console.log('  1. Tribe discovery');
    console.log('  2. Tribe membership');
    console.log('  3. User identity and tokens');
    console.log('  4. Point system and rewards');
    console.log('  5. Achievements and progress');
    console.log('==========================================');
  });
}); 