# Tribes by Astrix - Linea Sepolia Integration

This README provides an overview of the Linea Sepolia testnet integration for the Tribes by Astrix platform.

## Deployed Contracts

The following contracts are deployed on Linea Sepolia:

- **RoleManager**: `0x712367d8Cb169F57ACbB5004a5eF37a40AD7E05c`
- **TribeController**: `0xc48db49E745b3c4ac676437F4c4a8C3A2Aa3cA04`
- **AstrixToken**: `0x4E37b8C75C67B90F04893e28d769D0CaA59a136a`
- **TokenDispenser**: `0xAdc9E17ED14C3e6A354D6eFe6629115722799A5f`
- **PointSystem**: `0x0d47199562744c9ac86DCE04B5a772BbBB22c095`
- **CollectibleController**: `0x887507a28074500C52A2cfBd0D38cAc265E5eb31`
- **PostFeedManager**: `0x2c485c178Dc1D7Eb9924a4a7C15AAE965A5e43C6`
- **ProfileNFTMinter**: `0x81F0549496D47dB1560176cEe9DE248c05638Fb6`
- **EventController**: `0xf294b1eFb67BB6fE92880dBd1e1c759FCD9B0B5d`
- **PostMinter (Proxy)**: `0x1FAc7b53768c0eC41AFA4E45Ca23B35233FBC1E0`
- **PostCreationManager**: `0x36e8AE94d586FDa70743Da0Aaeaa4756D077E71C`
- **PostEncryptionManager**: `0xb1506C8F3b934261744B64d55612A6Bda97DDc14`
- **PostInteractionManager**: `0x4b9E7527eD342198273654da3Ee2710AF8EAB3f1`
- **PostQueryManager**: `0xd69914A092F745b548171c7131412ed57EDB7AD8`

## Deployment Information

The deployment details are stored in:
- Latest: `deployments/lineaSepolia-latest.json`
- Timestamped: `deployments/lineaSepolia-YYYY-MM-DD-timestamp.json`

## Integration Tests

We've created specialized tests for the Linea Sepolia deployment that handle the contract interface differences:

```bash
# Run the Linea Sepolia tests
./run-linea-tests.sh
```

Test files are located in:
- `test/lineaSepolia/*.test.ts`
- `test/helpers/lineaSepolia.ts`

## Key Findings

1. **Function Name Differences**: 
   - `getTotalTribesCount()` vs `getTotalTribes()`
   - `getTribeDetails()` vs `getTribe()`

2. **Modular Post System**:
   - PostMinter uses separate manager contracts for different functions
   - PostQueryManager handles queries like `getPostsByUser` and `getPostsByTribe`

3. **Data Structure Differences**:
   - Posts are returned as arrays rather than objects
   - Post IDs start at 0, not 1

## Analysis Tools

To analyze the deployed contracts:

```bash
npx hardhat run scripts/analyze-deployed-contracts.js --network lineaSepolia
```

## Detailed Documentation

Full details about the testing and integration can be found in:
- `linea-sepolia-test-report.md` - Comprehensive report on the integration
- `test/lineaSepolia/README.md` - Documentation for the test suite

## SDK Integration

When using the SDK with Linea Sepolia, you should:

1. Configure the SDK for the Linea Sepolia network:
```javascript
import { TribesSDK } from 'tribes-by-astrix';

const sdk = new TribesSDK({
  network: 'lineaSepolia',
  provider: yourProvider,
  signer: yourSigner
});
```

2. Be aware of interface differences when using the SDK with Linea Sepolia contracts.

## Next Steps

1. Update the SDK to properly handle the contract interface differences
2. Add data transformation functions to convert array data to objects
3. Create more comprehensive integration tests
4. Document Linea Sepolia-specific usage in the main SDK documentation 