# Tribes by Astrix Troubleshooting Guide

This guide provides solutions for common issues you might encounter when working with the Tribes by Astrix platform.

## Table of Contents

1. [SDK Integration Issues](#sdk-integration-issues)
2. [Contract Deployment Issues](#contract-deployment-issues)
3. [Transaction Errors](#transaction-errors)
4. [Post Creation Problems](#post-creation-problems)
5. [Tribe Management Issues](#tribe-management-issues)
6. [Authentication Problems](#authentication-problems)
7. [Network-Specific Issues](#network-specific-issues)
8. [Common Error Codes](#common-error-codes)

## SDK Integration Issues

### SDK initialization fails

**Problem**: The SDK fails to initialize with errors about missing configuration.

**Solution**:
- Ensure you're providing all required parameters in the SDK config:
  ```js
  const sdk = new AstrixSDK({
    provider: yourProvider,
    chainId: 1, // or appropriate network ID
    apiKey: 'your-api-key', // if applicable
    verbose: true // for debugging
  });
  ```
- Check that your provider instance is correctly instantiated.
- Verify that you're using a supported network.

### Cannot find contract addresses

**Problem**: Errors indicating contract addresses are missing.

**Solution**:
- Make sure you're using a supported network.
- Check the SDK's `contracts.ts` file to verify addresses are defined for your network.
- If using a custom deployment, use the `update-contract-addresses.js` script to update SDK's contract addresses.

### TypeScript errors when using SDK

**Problem**: TypeScript compilation errors when importing or using the SDK.

**Solution**:
- Update to the latest SDK version.
- Make sure your TypeScript version is compatible (check package.json).
- Check for proper type imports in your code.

## Contract Deployment Issues

### Deployment fails on Monad Devnet

**Problem**: Contract deployment fails on Monad Devnet with gas or nonce errors.

**Solution**:
- Ensure you have sufficient ETH in your deployer account.
- Check if the nonce is correct; if not, reset your account nonce or use a specific nonce.
- Verify Hardhat configuration for Monad Devnet in `hardhat.config.ts`.
- Try running with `--verbose` flag for more debugging information.

### Proxy deployment issues

**Problem**: Upgradeable contract deployments fail with initialization or storage layout errors.

**Solution**:
- Ensure your contract is properly structured for upgrades:
  - No constructors (use initialize methods instead)
  - No immutable variables in upgradeable contracts
  - Storage layout is compatible with previous versions
- Check that initialization parameters are correctly formatted.
- For storage layout errors, review the OpenZeppelin documentation about safe upgrades.

### Contract verification fails

**Problem**: Contract verification on block explorer fails.

**Solution**:
- Make sure to use the correct compiler version and optimization settings.
- For upgradeable contracts, verify the implementation contract, not the proxy.
- Use the hardhat-etherscan plugin with the correct API key:
  ```
  npx hardhat verify --network monadDevnet <IMPLEMENTATION_ADDRESS> --constructor-args arguments.js
  ```

## Transaction Errors

### "InvalidPostType" error

**Problem**: Transactions revert with "InvalidPostType" error.

**Solution**:
- Ensure the post type you're using is valid (check `PostValidationHelpers.sol`).
- Verify that all required metadata fields for that post type are present.
- Check the format of your metadata JSON structure.
- Make sure the post type is supported on the current network.

### Gas estimation failures

**Problem**: "Gas estimation failed" or "Out of gas" errors.

**Solution**:
- Increase the gas limit for your transaction.
- Check if your transaction is causing infinite loops or other high-computation issues.
- For complex operations, consider splitting them into multiple transactions.
- Ensure your contract state hasn't changed in a way that affects gas requirements.

### Transaction reverted without reason

**Problem**: Transaction reverts without a clear error message.

**Solution**:
- Enable verbose mode in the SDK to get more detailed error output.
- Check contract events for any emitted error information.
- Try calling the function as a static call first to get the revert reason.
- Examine the transaction trace using a block explorer or debug tools.

## Post Creation Problems

### Missing required fields

**Problem**: Post creation fails with errors about missing fields.

**Solution**:
- Check `PostValidationHelpers.sol` for required fields for each post type.
- Ensure all required fields are included in your metadata.
- Verify field formatting and types match requirements.
- Sample metadata structure:
  ```js
  {
    title: "Post Title",
    description: "Post description",
    content: "Post content",
    // Other fields based on post type
  }
  ```

### Incorrect metadata format

**Problem**: Post creation fails with metadata format errors.

**Solution**:
- Ensure your metadata is a valid JSON object.
- Check that all metadata values have the correct types.
- Limit metadata size (some networks have size restrictions).
- Validate your metadata against the schema before submitting.

### Post visibility issues

**Problem**: Created posts are not visible in feeds.

**Solution**:
- Verify the post was successfully created (check transaction receipt).
- Ensure you're looking in the correct feed or have correct filters applied.
- Check post permissions if it's in a private tribe.
- Wait for indexing to complete if you're using a feed service.

## Tribe Management Issues

### Cannot create tribe

**Problem**: Tribe creation fails with permission or parameter errors.

**Solution**:
- Ensure you have the correct role (check RoleManager).
- Verify all required parameters are provided and formatted correctly.
- Check for duplicate tribe names if getting uniqueness errors.
- Verify you have sufficient funds if there's a creation fee.

### Whitelist operations fail

**Problem**: Issues with adding or removing addresses from tribe whitelist.

**Solution**:
- Verify you're the tribe admin or have admin permissions.
- Check address format (must be valid Ethereum address).
- Ensure you're not exceeding whitelist limits.
- For batch operations, try processing in smaller batches.

### Join tribe issues

**Problem**: Users cannot join tribes.

**Solution**:
- Check tribe join type (open, whitelist, invite-only).
- For whitelist tribes, ensure user is on the whitelist.
- For invite-only tribes, verify invite code validity.
- Check if tribe has reached member capacity.
- Ensure user has sufficient funds for entry fee if applicable.

## Authentication Problems

### Role verification fails

**Problem**: Operations fail with role/permission errors.

**Solution**:
- Check if the user has the required role in RoleManager.
- Ensure the wallet is connected and using the correct account.
- Verify that roles are properly set up for the user's address.
- For custom roles, ensure the role exists and is correctly configured.

### Signature verification issues

**Problem**: Issues with message signing or signature verification.

**Solution**:
- Ensure you're using the correct signing method for your provider.
- Verify that the message format matches what the contract expects.
- Check if the wallet supports the signing method you're using.
- Try using `personal_sign` instead of `eth_sign` if available.

## Network-Specific Issues

### Monad Devnet issues

**Problem**: Issues specific to Monad Devnet.

**Solution**:
- Ensure you have the correct RPC URL: `https://rpc.monad.xyz/devnet`.
- Get testnet tokens from the faucet if needed.
- Check if the Devnet is currently active and not under maintenance.
- Update to the latest SDK version for Monad Devnet compatibility.

### Local development network issues

**Problem**: Problems with local development network.

**Solution**:
- Ensure Hardhat node is running: `npx hardhat node`.
- Verify contracts are deployed to the local network.
- Check MetaMask or wallet is connected to localhost:8545.
- Reset your MetaMask account if nonce issues occur.

## Common Error Codes

### InvalidPostType

**Cause**: The post type provided is not valid or not supported.

**Resolution**:
- Check valid post types in `PostValidationHelpers.sol`.
- Ensure the post type matches exactly (case-sensitive).

### NotAuthorized

**Cause**: The caller doesn't have permission for the operation.

**Resolution**:
- Check required roles in contract documentation.
- Use the RoleManager to assign necessary roles.
- Verify you're using the correct account.

### InvalidMetadata

**Cause**: Metadata format or required fields are incorrect.

**Resolution**:
- Validate metadata against schema requirements.
- Check field names and types match what's expected.
- Ensure all required fields for the specific post type are provided.

### TribeNotFound

**Cause**: Referenced tribe doesn't exist.

**Resolution**:
- Verify tribe ID exists in TribeController.
- Check if you're on the correct network.

### MembershipRequired

**Cause**: Operation requires tribe membership.

**Resolution**:
- Join the tribe before attempting operation.
- Verify membership status with `getMemberStatus` function.

---

If you continue to experience issues not covered in this guide, please report them on our [GitHub Issues](https://github.com/AstrixNetwork/tribes-by-astrix/issues) page or contact our support team. 