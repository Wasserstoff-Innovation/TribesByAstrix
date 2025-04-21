# Upgrading Contracts in Tribes by Astrix

This document provides a detailed guide on how to upgrade contracts in the Tribes by Astrix platform using the built-in upgrade functionality.

## Overview

Tribes by Astrix uses the OpenZeppelin UUPS (Universal Upgradeable Proxy Standard) pattern for upgradeable contracts. This allows us to deploy new contract implementations while preserving the contract's state and address.

The following contracts are upgradeable:
- RoleManager
- TribeController
- AstrixToken
- TokenDispenser
- PostMinter

## Prerequisites

Before upgrading a contract, ensure that:

1. You have the private key for an account with the correct upgrade permissions
2. You've tested the new implementation thoroughly
3. The new implementation is compatible with the existing storage layout
4. Your `.env` file is properly configured with the necessary variables

## Storage Layout Compatibility

When upgrading a contract, it's crucial to maintain storage layout compatibility. This means:

- Don't remove existing state variables
- Don't change the type of existing state variables
- Don't reorder existing state variables
- Only add new state variables at the end

You can use the OpenZeppelin storage layout tool to verify compatibility:

```bash
npx hardhat run scripts/check-storage-layout.js --contract YourContract
```

## Upgrade Process

### 1. Modify the Contract Code

First, update the contract code with your desired changes. Make sure to follow the storage layout compatibility rules mentioned above.

### 2. Compile the Contracts

Compile your contracts to ensure there are no errors:

```bash
npm run compile
```

### 3. Run the Upgrade Command

Use the Tribes CLI to upgrade the contract:

```bash
npm run upgrade -- --contract <ContractName> --proxy <ProxyAddress> --network <Network>
```

Or use one of the network-specific commands:

```bash
npm run upgrade:monad -- --contract <ContractName> --proxy <ProxyAddress>
npm run upgrade:mumbai -- --contract <ContractName> --proxy <ProxyAddress>
npm run upgrade:polygon -- --contract <ContractName> --proxy <ProxyAddress>
```

For example, to upgrade the TribeController on Monad Devnet:

```bash
npm run upgrade:monad -- --contract TribeController --proxy 0x1234...
```

### 4. Verify the New Implementation

After upgrading, verify the new implementation contract on the block explorer:

```bash
npm run verify:monad -- --address <NewImplementationAddress> --contract <ContractName>
```

### 5. Test the Upgraded Contract

Test the upgraded contract to ensure it works as expected:

```bash
npm run test:deployed
```

## Examples

### Upgrading the TribeController on Monad Devnet

```bash
# Step 1: Modify the TribeController.sol file
# Step 2: Compile the contracts
npm run compile

# Step 3: Upgrade the contract
npm run upgrade:monad -- --contract TribeController --proxy 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Step 4: Verify the new implementation
# Note: Get the new implementation address from the upgrade command output
npm run verify:monad -- --address 0xNewImplementationAddress --contract TribeController

# Step 5: Test the upgraded contract
npm run test:deployed
```

### Upgrading Multiple Contracts

If you need to upgrade multiple contracts, simply run the upgrade command for each contract:

```bash
npm run upgrade:monad -- --contract RoleManager --proxy 0x5FbDB2315678afecb367f032d93F642f64180aa3
npm run upgrade:monad -- --contract TribeController --proxy 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

## Troubleshooting

### Error: Cannot upgrade to an implementation with incompatible storage

This error occurs when the new implementation is not compatible with the existing storage layout. Make sure you're following the storage layout compatibility rules.

### Error: Transaction reverted without a reason

This often means the account you're using doesn't have the required upgrade permissions. Make sure you're using an account with admin/owner privileges.

### Error: Cannot estimate gas

Try increasing the gas limit in your Hardhat configuration or check if your contract has a bug that's causing it to run out of gas.

## Additional Resources

- [OpenZeppelin Upgrades Documentation](https://docs.openzeppelin.com/upgrades-plugins/1.x/)
- [UUPS Proxies](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable)
- [Proxy Upgrade Pattern](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies) 