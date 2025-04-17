import { ethers } from 'ethers';
import { AstrixSDK } from '../src';

async function main() {
  // Initialize SDK with configuration
  const sdk = new AstrixSDK({
    provider: 'https://rpc-provider-url.example',
    contracts: {
      // Replace with actual contract addresses
      astrixToken: '0x1234567890123456789012345678901234567890',
      tokenDispenser: '0x1234567890123456789012345678901234567891',
      astrixPointSystem: '0x1234567890123456789012345678901234567892',
      roleManager: '0x1234567890123456789012345678901234567893',
      tribeController: '0x1234567890123456789012345678901234567894',
      profileNFTMinter: '0x1234567890123456789012345678901234567895',
    },
    verbose: true,
  });

  // Create a wallet from a private key (for demonstration only)
  // In production, use a secure wallet provider
  const privateKey = 'YOUR_PRIVATE_KEY'; // Replace with actual private key
  const provider = new ethers.JsonRpcProvider('https://rpc-provider-url.example');
  const wallet = new ethers.Wallet(privateKey, provider);

  // Connect the SDK with the wallet
  await sdk.connect(wallet);
  console.log('Connected with address:', await sdk.getAddress());

  try {
    // Example 1: Get token information
    const tokenInfo = await sdk.token.getTokenInfo();
    console.log('Token Information:', tokenInfo);

    // Example 2: Deposit tokens to the dispenser
    const depositAmount = ethers.parseEther('100'); // 100 tokens
    const depositTx = await sdk.token.deposit({ amount: depositAmount });
    console.log('Deposit transaction hash:', depositTx);

    // Example 3: Set up a tribe with Astrix points
    const tribeId = 1; // Replace with actual tribe ID
    const organization = await sdk.getAddress(); // Use the connected wallet as the organization
    
    // Set the organization for the tribe
    const setOrgTx = await sdk.points.setTribeOrganization({
      tribeId,
      organization
    });
    console.log('Set organization transaction hash:', setOrgTx);
    
    // Create a tribe token
    const createTokenTx = await sdk.points.createTribeToken({
      tribeId,
      name: 'Tribe Token',
      symbol: 'TT'
    });
    console.log('Create tribe token transaction hash:', createTokenTx);
    
    // Set exchange rate (10 tribe tokens per 1 Astrix token)
    const setRateTx = await sdk.points.setExchangeRate({
      tribeId,
      rate: 10
    });
    console.log('Set exchange rate transaction hash:', setRateTx);
    
    // Set points for actions
    const setPointsTx = await sdk.points.setActionPoints({
      tribeId,
      actionType: 'POST',
      points: 100
    });
    console.log('Set action points transaction hash:', setPointsTx);

    // Example 4: Award points to a member
    const memberAddress = '0x0987654321098765432109876543210987654321'; // Replace with actual member address
    const awardTx = await sdk.points.awardPoints({
      tribeId,
      member: memberAddress,
      points: 50,
      actionType: 'CUSTOM'
    });
    console.log('Award points transaction hash:', awardTx);

    // Example 5: Get member's point balance
    const balance = await sdk.points.getMemberPoints(tribeId, memberAddress);
    console.log('Member point balance:', balance);

    // Example 6: Get top members
    const topMembers = await sdk.points.getTopMembers(tribeId, 5);
    console.log('Top 5 members:', topMembers);

  } catch (error) {
    console.error('Error:', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 