# Troubleshooting Guide

This guide addresses common issues you might encounter when working with the Tribes by Astrix platform and SDK.

## SDK Connection Issues

### Cannot Connect to Network

**Symptoms:**
- `Network connection error` messages
- Timeout errors
- SDK initialization failures

**Solutions:**
1. Check your RPC URL is correct and accessible:
   ```typescript
   // Test the RPC endpoint
   const provider = new JsonRpcProvider('https://rpc.sepolia.linea.build');
   const blockNumber = await provider.getBlockNumber();
   console.log('Current block number:', blockNumber);
   ```

2. Ensure you're using the correct chain ID:
   ```typescript
   // Linea Sepolia testnet
   chainId: 59141,
   
   // Linea Mainnet
   chainId: 59144
   ```

3. Try a different RPC provider if issues persist.

### Wallet Connection Errors

**Symptoms:**
- `No provider detected` errors
- `User rejected request` errors
- MetaMask not appearing when connecting

**Solutions:**
1. Ensure the browser has a wallet extension installed and is unlocked.

2. Check if the user has rejected the connection request.

3. Verify that you're requesting wallet connection properly:
   ```typescript
   // Correct wallet connection flow
   await window.ethereum.request({ method: 'eth_requestAccounts' });
   const provider = new BrowserProvider(window.ethereum);
   const signer = await provider.getSigner();
   await sdk.connect(signer);
   ```

4. If using in Node.js, ensure you're using a private key:
   ```typescript
   const privateKey = process.env.PRIVATE_KEY;
   const wallet = new Wallet(privateKey, provider);
   await sdk.connect(wallet);
   ```

## Transaction Errors

### Transaction Reverted

**Symptoms:**
- `Transaction has been reverted by the EVM` errors
- Function calls fail with revert messages

**Solutions:**
1. Check if your wallet has sufficient funds for gas.

2. Verify you have the correct permissions/roles for the action:
   ```typescript
   // Check if user has the required role
   const hasRole = await sdk.hasRole('COMMUNITY_ADMIN', tribeId, userAddress);
   if (!hasRole) {
     console.error('User does not have admin role required for this action');
   }
   ```

3. Examine the specific error message for contract-specific reasons:
   ```typescript
   try {
     await sdk.tribes.createTribe(/* ... */);
   } catch (error) {
     console.error('Transaction reverted:', error.message);
     // Look for specific reasons in the error message
   }
   ```

### Gas Estimation Failed

**Symptoms:**
- `Gas estimation failed` errors
- `Execution reverted` errors during gas estimation

**Solutions:**
1. Manually specify gas limits in transaction options:
   ```typescript
   await sdk.tribes.createTribe(
     {
       name: "My Tribe",
       // other parameters...
     },
     {
       gasLimit: 500000 // Manually set gas limit
     }
   );
   ```

2. Check if your transaction parameters are valid before sending.

3. Ensure the contract functions are callable in the current state.

## SDK Method Errors

### Invalid Parameters

**Symptoms:**
- `Invalid parameter` errors
- Type errors or validation errors

**Solutions:**
1. Check parameter types match what the SDK expects:
   ```typescript
   // Correct parameter format for createTribe
   await sdk.tribes.createTribe({
     name: "My Tribe", // String
     metadata: JSON.stringify({
       description: "A community for blockchain enthusiasts",
       logoUrl: "https://example.com/logo.png",
       coverImageUrl: "https://example.com/cover.png"
     }) // Must be a stringified JSON
   });
   ```

2. Verify array parameters have the expected structure:
   ```typescript
   // Batch award points requires an array of objects
   await sdk.points.batchAwardPoints(tribeId, [
     { address: "0x123...", amount: 100, reason: "Contest winner" },
     { address: "0x456...", amount: 50, reason: "Runner-up" }
   ]);
   ```

### Contract Not Found

**Symptoms:**
- `Contract not found` errors
- `Invalid contract address` errors

**Solutions:**
1. Ensure you're using the correct deployment addresses:
   ```typescript
   // Load deployment from file
   const deploymentPath = path.join(__dirname, "deployments", `${network.name}-latest.json`);
   const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
   
   // Initialize SDK with correct addresses
   const sdk = new AstrixSDK({
     provider,
     chainId: deploymentData.chainId,
     contracts: {
       roleManager: deploymentData.contracts.RoleManager.proxy,
       tribeController: deploymentData.contracts.TribeController.proxy,
       // other addresses...
     }
   });
   ```

2. Verify the contracts are deployed on the network you're connecting to.

3. Check if you're using the correct network in your SDK initialization.

## Tribe Token Issues

### Token Creation Failures

**Symptoms:**
- `Failed to create tribe token` errors
- Token creation transactions reverting

**Solutions:**
1. Verify you have the required role to create tokens:
   ```typescript
   const callerAddress = await sdk.getSignerAddress();
   const isAdmin = await sdk.hasRole('COMMUNITY_ADMIN', tribeId, callerAddress);
   
   if (!isAdmin) {
     console.error('Only admins can create tribe tokens');
   }
   ```

2. Check if a token already exists for the tribe:
   ```typescript
   const tokenAddress = await sdk.points.getTribeTokenAddress(tribeId);
   console.log(`Existing token address: ${tokenAddress}`);
   
   if (tokenAddress !== ethers.ZeroAddress) {
     console.error('Tribe already has a token');
   }
   ```

3. Ensure you're providing valid token parameters:
   ```typescript
   await sdk.points.createTribeToken({
     tribeId, // Must be a valid tribe ID
     name: "Community Token", // Non-empty string
     symbol: "COMM" // Non-empty string, typically 3-5 characters
   });
   ```

## Debugging Techniques

### Enable Verbose Logging

Turn on verbose logging in the SDK for detailed information:

```typescript
const sdk = new AstrixSDK({
  provider,
  chainId: 59141,
  verbose: true // Enable detailed logging
});
```

### Inspect Transaction Data

For failed transactions, inspect the transaction data:

```typescript
async function debugTransaction(txHash) {
  const tx = await sdk.provider.getTransaction(txHash);
  console.log('Transaction data:', tx.data);
  console.log('From:', tx.from);
  console.log('To:', tx.to);
  console.log('Value:', tx.value.toString());
  
  try {
    const receipt = await sdk.provider.getTransactionReceipt(txHash);
    console.log('Status:', receipt.status === 1 ? 'Success' : 'Failed');
    console.log('Gas used:', receipt.gasUsed.toString());
    console.log('Events:', receipt.logs);
  } catch (error) {
    console.error('Transaction not mined yet');
  }
  
  return tx;
}
```

### Test with Minimal Examples

If having issues with complex operations, try minimal test cases:

```typescript
// Test basic connectivity
async function testConnectivity() {
  try {
    const network = await sdk.getNetworkInfo();
    console.log('Connected to:', network.name, network.chainId);
    return true;
  } catch (error) {
    console.error('Connectivity test failed:', error);
    return false;
  }
}

// Test contract read operations
async function testReadOperations() {
  try {
    const tribes = await sdk.tribes.getTribes();
    console.log('Found tribes:', tribes.length);
    return true;
  } catch (error) {
    console.error('Read operations test failed:', error);
    return false;
  }
}
```

## Getting Help

If you're still having issues after trying these troubleshooting steps:

1. Check the [GitHub Issues](https://github.com/Wasserstoff-Innovation/TribesByAstrix/issues) for similar problems and solutions.

2. Open a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Error messages and stack traces
   - Environment details (SDK version, network, etc.)

3. Contact the team at [support@astrix.live](mailto:support@astrix.live) for direct assistance. 