import { ethers } from "hardhat";

/**
 * This script validates the Astrix token integration deployment
 * It should be run after deployment to verify all contracts are correctly set up
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Validating Astrix token integration with account:", deployer.address);

  // Get contract addresses from environment or hardcoded values
  // Replace these with your actual deployed contract addresses
  const astrixTokenAddress = process.env.ASTRIX_TOKEN_ADDRESS || "0x...";
  const tokenDispenserAddress = process.env.TOKEN_DISPENSER_ADDRESS || "0x...";
  const astrixPointSystemAddress = process.env.ASTRIX_POINT_SYSTEM_ADDRESS || "0x...";
  const tribeControllerAddress = process.env.TRIBE_CONTROLLER_ADDRESS || "0x...";

  // Connect to deployed contracts
  const AstrixToken = await ethers.getContractFactory("AstrixToken");
  const astrixToken = AstrixToken.attach(astrixTokenAddress);

  const TokenDispenser = await ethers.getContractFactory("TokenDispenser");
  const tokenDispenser = TokenDispenser.attach(tokenDispenserAddress);

  const AstrixPointSystem = await ethers.getContractFactory("AstrixPointSystem");
  const astrixPointSystem = AstrixPointSystem.attach(astrixPointSystemAddress);

  const TribeController = await ethers.getContractFactory("TribeController");
  const tribeController = TribeController.attach(tribeControllerAddress);

  console.log("Connected to deployed contracts");

  // Validation Tests
  console.log("\nRunning validation tests...");

  // 1. Check Astrix Token basics
  const tokenName = await astrixToken.name();
  const tokenSymbol = await astrixToken.symbol();
  const totalSupply = await astrixToken.totalSupply();
  console.log(`\n1. Astrix Token Details:`);
  console.log(`   - Name: ${tokenName}`);
  console.log(`   - Symbol: ${tokenSymbol}`);
  console.log(`   - Total Supply: ${ethers.formatEther(totalSupply)} ASTRX`);
  
  const deployerBalance = await astrixToken.balanceOf(deployer.address);
  console.log(`   - Deployer Balance: ${ethers.formatEther(deployerBalance)} ASTRX`);

  // 2. Check Token Dispenser setup
  const astrixTokenInDispenser = await tokenDispenser.astrixToken();
  console.log(`\n2. Token Dispenser Setup:`);
  console.log(`   - Configured Astrix Token: ${astrixTokenInDispenser}`);
  console.log(`   - Token Reference Correct: ${astrixTokenInDispenser.toLowerCase() === astrixTokenAddress.toLowerCase()}`);
  
  const dispenserBalance = await astrixToken.balanceOf(tokenDispenserAddress);
  console.log(`   - Dispenser Token Balance: ${ethers.formatEther(dispenserBalance)} ASTRX`);

  // 3. Check AstrixPointSystem configuration
  console.log(`\n3. AstrixPointSystem Configuration:`);
  const pointSystemAstrixToken = await astrixPointSystem.astrixToken();
  const pointSystemTokenDispenser = await astrixPointSystem.tokenDispenser();
  console.log(`   - Configured Astrix Token: ${pointSystemAstrixToken}`);
  console.log(`   - Token Reference Correct: ${pointSystemAstrixToken.toLowerCase() === astrixTokenAddress.toLowerCase()}`);
  console.log(`   - Configured Token Dispenser: ${pointSystemTokenDispenser}`);
  console.log(`   - Dispenser Reference Correct: ${pointSystemTokenDispenser.toLowerCase() === tokenDispenserAddress.toLowerCase()}`);

  // 4. Test platform role in token dispenser
  const PLATFORM_ROLE = await tokenDispenser.PLATFORM_ROLE();
  const hasRole = await tokenDispenser.hasRole(PLATFORM_ROLE, astrixPointSystemAddress);
  console.log(`\n4. Role Configuration:`);
  console.log(`   - AstrixPointSystem has PLATFORM_ROLE in TokenDispenser: ${hasRole}`);

  // 5. Create a test tribe if none exists
  let tribeId = 1; // Default to first tribe
  try {
    const tribeCount = await tribeController.getTribeCount();
    if (tribeCount.toString() === '0') {
      console.log(`\n5. Creating Test Tribe:`);
      // Create a tribe for testing
      const createTribeTx = await tribeController.createTribe(
        "Test Tribe",
        "A tribe for testing Astrix integration",
        "https://example.com/image.png",
        ethers.ZeroAddress, // No NFT requirement
        0, // Open join type
        []
      );
      await createTribeTx.wait();
      console.log(`   - Created test tribe with ID: ${tribeId}`);
    } else {
      console.log(`\n5. Using Existing Tribe:`);
      console.log(`   - ${tribeCount.toString()} tribes already exist in the system`);
    }
  } catch (error) {
    console.error(`   - Error accessing/creating tribe: ${error}`);
  }

  // 6. Configure tribe with organization and token
  console.log(`\n6. Setting Up Tribe for Astrix Integration:`);
  
  try {
    // First check if tribe has an organization
    const organization = await astrixPointSystem.tribeOrganizations(tribeId);
    
    if (organization === ethers.ZeroAddress) {
      // Set the deployer as the organization for this tribe
      const setOrgTx = await astrixPointSystem.setTribeOrganization(tribeId, deployer.address);
      await setOrgTx.wait();
      console.log(`   - Set deployer as organization for tribe ${tribeId}`);
    } else {
      console.log(`   - Tribe ${tribeId} already has organization: ${organization}`);
    }

    // Create tribe token if it doesn't exist
    const tokenAddress = await astrixPointSystem.tribeTokens(tribeId);
    
    if (tokenAddress === ethers.ZeroAddress) {
      const createTokenTx = await astrixPointSystem.createTribeToken(
        tribeId,
        "Tribe Test Token",
        "TTT"
      );
      await createTokenTx.wait();
      const newTokenAddress = await astrixPointSystem.tribeTokens(tribeId);
      console.log(`   - Created tribe token at: ${newTokenAddress}`);
    } else {
      console.log(`   - Tribe ${tribeId} already has token at: ${tokenAddress}`);
    }

    // Set exchange rate
    const exchangeRate = await astrixPointSystem.exchangeRates(tribeId);
    if (exchangeRate.toString() === '0' || exchangeRate.toString() === '1') {
      const setRateTx = await astrixPointSystem.setExchangeRate(tribeId, 100); // 100 tribe tokens per 1 Astrix
      await setRateTx.wait();
      console.log(`   - Set exchange rate to 100 tribe tokens per 1 Astrix token`);
    } else {
      console.log(`   - Exchange rate already set to: ${exchangeRate.toString()} tribe tokens per 1 Astrix`);
    }
  } catch (error) {
    console.error(`   - Error setting up tribe: ${error}`);
  }

  // 7. Deposit Astrix tokens to the dispenser (if needed)
  try {
    const currentDispenserBalance = await tokenDispenser.getBalance(deployer.address);
    console.log(`\n7. Testing Token Deposits:`);
    console.log(`   - Current dispenser balance for deployer: ${ethers.formatEther(currentDispenserBalance)} ASTRX`);
    
    if (currentDispenserBalance.toString() === '0') {
      // First approve tokens to be spent by the dispenser
      const approveTx = await astrixToken.approve(tokenDispenserAddress, ethers.parseEther("100"));
      await approveTx.wait();
      console.log(`   - Approved 100 ASTRX to be used by dispenser`);
      
      // Deposit tokens
      const depositTx = await tokenDispenser.deposit(ethers.parseEther("100"));
      await depositTx.wait();
      
      const newBalance = await tokenDispenser.getBalance(deployer.address);
      console.log(`   - Deposited 100 ASTRX to dispenser`);
      console.log(`   - New dispenser balance: ${ethers.formatEther(newBalance)} ASTRX`);
    } else {
      console.log(`   - Dispenser already has tokens for deployer, skipping deposit`);
    }
  } catch (error) {
    console.error(`   - Error depositing tokens: ${error}`);
  }

  // 8. Test awarding points
  console.log(`\n8. Testing Point Award:`);
  try {
    // Set action points value if needed
    const POST_ACTION = ethers.keccak256(ethers.toUtf8Bytes("POST"));
    const currentPoints = await astrixPointSystem.actionPoints(tribeId, POST_ACTION);
    
    if (currentPoints.toString() === '0') {
      const setPointsTx = await astrixPointSystem.setActionPoints(tribeId, POST_ACTION, 50);
      await setPointsTx.wait();
      console.log(`   - Set POST action to 50 points`);
    } else {
      console.log(`   - POST action already set to ${currentPoints.toString()} points`);
    }

    // Award points to the deployer (who should be a member)
    // Make deployer a member if not already
    try {
      const memberStatus = await tribeController.getMemberStatus(tribeId, deployer.address);
      
      if (memberStatus.toString() === '0') { // Not a member
        console.log(`   - Adding deployer as tribe member first`);
        const joinTx = await tribeController.joinTribe(tribeId);
        await joinTx.wait();
      }
      
      // Award points
      const awardTx = await astrixPointSystem.awardPoints(tribeId, deployer.address, 50, POST_ACTION);
      await awardTx.wait();
      console.log(`   - Awarded 50 points to deployer for POST action`);
      
      // Check member points
      const points = await astrixPointSystem.getMemberPoints(tribeId, deployer.address);
      console.log(`   - Deployer now has ${points.toString()} points in tribe ${tribeId}`);
      
    } catch (error) {
      console.error(`   - Error awarding points: ${error}`);
    }
  } catch (error) {
    console.error(`   - Error in points testing: ${error}`);
  }

  console.log("\nValidation Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 