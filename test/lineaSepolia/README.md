# Linea Sepolia Tests

This directory contains tests specifically for the Linea Sepolia testnet deployment. These tests are designed to work with the deployed contracts on Linea Sepolia and understand their interface differences compared to the standard unit tests.

## Running the Tests

To run all tests:

```bash
./run-linea-tests.sh
```

To run only contract tests:

```bash
./run-linea-tests.sh --contracts
```

To run only journey tests:

```bash
./run-linea-tests.sh --journeys
```

To run specific tests:

```bash
./run-linea-tests.sh RoleManager TribeController
./run-linea-tests.sh --journeys UserOnboarding
```

For more options:

```bash
./run-linea-tests.sh --help
```

## File Structure

### Contract Tests

- **RoleManager.test.ts**: Tests for the RoleManager contract
- **TribeController.test.ts**: Tests for the TribeController contract
- **PostMinter.test.ts**: Tests for the PostMinter/PostQueryManager system
- **ProfileNFTMinter.test.ts**: Tests for the ProfileNFTMinter contract
- **TokenDispenser.test.ts**: Tests for the TokenDispenser contract
- **AstrixPointSystem.test.ts**: Tests for the AstrixPointSystem contract
- **CollectibleController.test.ts**: Tests for the CollectibleController contract
- **ProjectController.test.ts**: Tests for the ProjectController contract
- **EventController.test.ts**: Tests for the EventController contract

### Journey Tests

The `journeys/` directory contains end-to-end tests that simulate user workflows:

- **UserOnboarding.test.ts**: Simulates the user onboarding flow
  - Checking user roles
  - Checking for profile NFT
  - Exploring tribes to join
  - Token claiming
  - Point system interactions

- **ContentCreation.test.ts**: Simulates the content creation journey
  - Checking tribe membership
  - Exploring existing posts
  - Post creation flow
  - Post interaction (likes, comments)
  - Content rewards and point system

- **ProjectEventJourney.test.ts**: Simulates project and event participation
  - Exploring existing projects
  - Project creation flow
  - Exploring upcoming events
  - Event creation flow
  - Event registration and attendance

## Test Helpers

These tests use helper functions from `test/helpers/lineaSepolia.ts` to:

1. Load the deployed contracts from the `deployments/lineaSepolia-latest.json` file
2. Connect to them with the test signers
3. Handle contract interface differences

## Contract Interfaces

The deployed contracts on Linea Sepolia have some interface differences compared to the unit tests:

### TribeController
- Uses `getTotalTribesCount()` instead of `getTotalTribes()`
- Uses `getTribeDetails()` instead of `getTribe()`

### PostMinter
- Uses a modular design with separate managers
- `PostQueryManager` is used for querying posts
- `PostCreationManager` for creating posts
- `PostEncryptionManager` for encryption
- `PostInteractionManager` for handling interactions

### ProfileNFTMinter
- Standard ERC721 interface with additional functions for profile management
- Includes methods for checking token metadata and ownership

### TokenDispenser
- Manages token distribution for ecosystem activities
- Includes functions for checking claim eligibility and amounts

### AstrixPointSystem
- Tracks points earned by users for various activities
- Includes functions for checking point balances, history, and limits

### CollectibleController
- Manages NFT collections and collectible types
- Includes methods for checking user collectibles and balances
- Supports querying collection and collectible type details

### ProjectController
- Manages project listings in the ecosystem
- Includes methods for retrieving projects by tribe, creator, and category
- Supports detailed project information and metadata

### EventController
- Manages events and event registrations
- Includes methods for retrieving events by tribe, organizer, and time
- Supports checking event attendees and registration status

## Test Limitations

These tests are read-only and don't modify on-chain state. They verify the ability to:

1. Connect to deployed contracts
2. Call view functions 
3. Parse the returned data

For more comprehensive testing, you would need to use accounts with ETH and appropriate permissions on Linea Sepolia.

## Analysis Tools

To analyze the deployed contracts further, use:

```bash
npx hardhat run scripts/analyze-deployed-contracts.js --network lineaSepolia
```

This will output a detailed breakdown of the functions available in each contract.

For a complete report on the Linea Sepolia deployment and testing, see `linea-sepolia-test-report.md` in the project root. 