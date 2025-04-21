# Fix Contract Deployment in Tests for ethers.js v6 Compatibility

## Problem
Tests were failing due to incompatibility with ethers.js v6 constructor argument handling. In ethers.js v6, contract deployment parameters must be passed differently compared to v5.

## Solution
- Created automated fix scripts (`scripts/fix-tests.js` and `scripts/fix-tests-v2.js`) to update contract deployment syntax in test files.
- Updated deployment code to use `upgrades.deployProxy` for upgradeable contracts like RoleManager, TribeController, PostMinter, etc.
- Fixed constructor argument passing to be compatible with ethers.js v6.

## Changes
1. Added `upgrades` import to all affected test files:
   ```typescript
   import { ethers, upgrades } from "hardhat";
   ```

2. Updated RoleManager deployment:
   ```typescript
   // Before:
   roleManager = await RoleManager.deploy();
   
   // After:
   roleManager = await upgrades.deployProxy(RoleManager, [], { kind: 'uups' });
   ```

3. Updated TribeController deployment:
   ```typescript
   // Before:
   tribeController = await TribeController.deploy(await roleManager.getAddress());
   
   // After:
   tribeController = await upgrades.deployProxy(TribeController, [await roleManager.getAddress()], { kind: 'uups' });
   ```

4. Updated PostMinter deployment:
   ```typescript
   // Before:
   postMinter = await PostMinter.deploy(
     await roleManager.getAddress(),
     await tribeController.getAddress(),
     await collectibleController.getAddress(),
     await feedManager.getAddress()
   );
   
   // After:
   postMinter = await upgrades.deployProxy(PostMinter, [
     await roleManager.getAddress(),
     await tribeController.getAddress(),
     await collectibleController.getAddress(),
     await feedManager.getAddress()
   ], { 
     kind: 'uups',
     unsafeAllow: ['constructor'] 
   });
   ```

## Files Affected
- Most test files in `test/unit`, `test/journey`, and `test/integration` directories
- A total of approximately 30 files were fixed

## Testing
- Fixed tests have been run and pass successfully
- Automated fix script verifies corrections work by running a sample test

## Additional Notes
Some contracts can remain with direct deployment if they are not upgradeable. The fix scripts focus on the contracts that use the UUPS upgradeable pattern. 