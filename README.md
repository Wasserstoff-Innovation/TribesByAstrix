## 1. Project Structure

A typical Hardhat project might look like this:

```
my-astrix-project/
  ├─ contracts/
  │   ├─ ProfileNFTMinter.sol
  │   ├─ TribeController.sol
  │   ├─ CollectibleController.sol
  │   ├─ PostMinter.sol
  │   └─ Voting.sol
  ├─ scripts/
  │   └─ deploy.js
  ├─ test/
  │   └─ <your-tests-here>.test.js
  ├─ hardhat.config.js
  ├─ package.json
  └─ README.md
```

### `contracts/ProfileNFTMinter.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * ProfileNFTMinter:
 * Mints user profile NFTs, storing an immutable username and mutable metadata (e.g., avatar).
 */
contract ProfileNFTMinter is ERC721 {
    uint256 public nextTokenId;
    uint256 public mintFee;

    // Mapping: tokenId => metadata key => value
    mapping(uint256 => mapping(string => string)) public profileMetadata;

    event ProfileNFTMinted(
        address indexed user,
        uint256 indexed tokenId,
        string username
    );
    event ProfileMetadataUpdated(
        uint256 indexed tokenId,
        string key,
        string value
    );

    constructor(uint256 _mintFee) ERC721("ProfileNFT", "PFT") {
        mintFee = _mintFee;
    }

    function mintProfileNFT(
        string calldata username,
        string calldata avatarURI
    ) external payable returns (uint256) {
        require(msg.value >= mintFee, "Insufficient fee");

        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);

        // Store username and initial avatar
        profileMetadata[tokenId]["username"] = username;
        profileMetadata[tokenId]["avatarURI"] = avatarURI;

        emit ProfileNFTMinted(msg.sender, tokenId, username);
        return tokenId;
    }

    function setProfileMetadata(
        uint256 tokenId,
        string calldata key,
        string calldata value
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        profileMetadata[tokenId][key] = value;
        emit ProfileMetadataUpdated(tokenId, key, value);
    }
}
```

### `contracts/TribeController.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * TribeController:
 * Manages tribes, including creation and updates.
 */
contract TribeController {
    uint256 public nextTribeId;

    struct Tribe {
        string name;
        string metadata;
        address admin;
        address[] whitelist;
    }

    mapping(uint256 => Tribe) public tribes;

    event TribeCreated(
        uint256 indexed tribeId,
        address indexed creator,
        string tribeName
    );
    event TribeUpdated(uint256 indexed tribeId, string newMetadata);

    function createTribe(
        string calldata tribeName,
        string calldata tribeMetadata,
        address[] calldata whitelist
    ) external returns (uint256) {
        uint256 tribeId = nextTribeId++;
        tribes[tribeId] = Tribe({
            name: tribeName,
            metadata: tribeMetadata,
            admin: msg.sender,
            whitelist: whitelist
        });

        emit TribeCreated(tribeId, msg.sender, tribeName);
        return tribeId;
    }

    function updateTribe(
        uint256 tribeId,
        string calldata newMetadata,
        address[] calldata updatedWhitelist
    ) external {
        require(tribes[tribeId].admin == msg.sender, "Not tribe admin");

        tribes[tribeId].metadata = newMetadata;
        tribes[tribeId].whitelist = updatedWhitelist;
        emit TribeUpdated(tribeId, newMetadata);
    }
}
```

### `contracts/CollectibleController.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * CollectibleController:
 * Handles NFT collectible minting and verification logic (e.g., whitelisting).
 */
contract CollectibleController {
    // Mapping for collectibleType => (user => approved)
    mapping(uint256 => mapping(address => bool)) public collectibleWhitelist;

    event CollectibleMinted(
        address indexed user,
        uint256 collectibleType,
        uint256 tokenId
    );
    event AccessVerified(
        address indexed user,
        bytes32 sessionKey
    );

    function mintCollectible(uint256 collectibleType) external {
        require(
            verifyPreconditionsForPurchase(msg.sender, collectibleType),
            "Preconditions not met"
        );
        // Mint logic: Replace with your actual token minting logic.
        uint256 tokenId = 0; // For demonstration only; you'd likely integrate ERC721 or ERC1155 here.
        emit CollectibleMinted(msg.sender, collectibleType, tokenId);
    }

    function verifyPreconditionsForPurchase(
        address user,
        uint256 collectibleType
    ) public view returns (bool) {
        // Check if the user is whitelisted or meets other preconditions.
        return collectibleWhitelist[collectibleType][user];
    }

    function verifyAccessAndGenerateSessionKey(
        address user,
        address nftContract,
        uint256 tokenId,
        bytes calldata signature
    ) external returns (bytes32) {
        // Verify NFT ownership and signature here.
        // For example, you could do an ECDSA signature check or check ownerOf(tokenId).
        bytes32 sessionKey = keccak256(
            abi.encodePacked(user, nftContract, tokenId, signature)
        );

        emit AccessVerified(user, sessionKey);
        return sessionKey;
    }
}
```

### `contracts/PostMinter.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * PostMinter:
 * Creates posts within a given tribe ID. Could enforce checks on user roles or NFT ownership.
 */
contract PostMinter {
    uint256 public nextPostId;

    event PostCreated(
        uint256 indexed postId,
        uint256 indexed tribeId,
        address indexed creator,
        string content
    );

    function createPost(
        uint256 tribeId,
        string calldata content
    ) external returns (uint256) {
        uint256 postId = nextPostId++;
        // Optionally, add checks for tribe membership, NFT ownership, etc.
        emit PostCreated(postId, tribeId, msg.sender, content);
        return postId;
    }
}
```

### `contracts/Voting.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Voting:
 * Basic governance for tribes, allowing proposals and votes.
 */
contract Voting {
    uint256 public nextProposalId;

    struct Proposal {
        uint256 tribeId;
        string details;
        uint256 voteCount;
        // Optionally, you can store mapping of voter => bool to track who has voted
    }

    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed tribeId,
        address indexed creator,
        string proposalDetails
    );
    event VoteCasted(
        uint256 indexed proposalId,
        address indexed voter,
        bool voteChoice
    );

    function createProposal(
        uint256 tribeId,
        string calldata proposalDetails
    ) external returns (uint256) {
        uint256 proposalId = nextProposalId++;
        proposals[proposalId] = Proposal({
            tribeId: tribeId,
            details: proposalDetails,
            voteCount: 0
        });

        emit ProposalCreated(proposalId, tribeId, msg.sender, proposalDetails);
        return proposalId;
    }

    function vote(uint256 proposalId, bool voteChoice) external {
        // Implement checks for voter eligibility if needed (e.g., NFT ownership, tribe membership).
        if (voteChoice) {
            proposals[proposalId].voteCount += 1;
        }
        emit VoteCasted(proposalId, msg.sender, voteChoice);
    }
}
```

---

## 2. Hardhat Configuration

In the root folder, create `hardhat.config.js` (or `hardhat.config.ts` if you prefer TypeScript). A minimal example:

```js
require("@nomicfoundation/hardhat-toolbox"); // or the appropriate plugin package

module.exports = {
  solidity: "0.8.19",
  networks: {
    // Example: local Hardhat network
    hardhat: {},
    // Example: Goerli testnet
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/<YOUR_KEY>",
      accounts: ["0xYOUR_PRIVATE_KEY"]
    }
    // Add other networks if desired
  }
};
```

> Make sure you have installed necessary packages, e.g.:
> 
> ```bash
> npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
> ```

---

## 3. Deployment Script

Create a `scripts/deploy.js` file (or `deploy.ts`) that deploys each contract in a sequence. Below is a simple JavaScript example:

```js
const hre = require("hardhat");

async function main() {
  // 1. Deploy ProfileNFTMinter
  const ProfileNFTMinter = await hre.ethers.getContractFactory("ProfileNFTMinter");
  const profileNftMinter = await ProfileNFTMinter.deploy(
    hre.ethers.utils.parseEther("0.01") // Example mint fee
  );
  await profileNftMinter.deployed();
  console.log("ProfileNFTMinter deployed to:", profileNftMinter.address);

  // 2. Deploy TribeController
  const TribeController = await hre.ethers.getContractFactory("TribeController");
  const tribeController = await TribeController.deploy();
  await tribeController.deployed();
  console.log("TribeController deployed to:", tribeController.address);

  // 3. Deploy CollectibleController
  const CollectibleController = await hre.ethers.getContractFactory("CollectibleController");
  const collectibleController = await CollectibleController.deploy();
  await collectibleController.deployed();
  console.log("CollectibleController deployed to:", collectibleController.address);

  // 4. Deploy PostMinter
  const PostMinter = await hre.ethers.getContractFactory("PostMinter");
  const postMinter = await PostMinter.deploy();
  await postMinter.deployed();
  console.log("PostMinter deployed to:", postMinter.address);

  // 5. Deploy Voting
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.deployed();
  console.log("Voting deployed to:", voting.address);

  // Optionally, you might want to wire them up (e.g., if CollectibleController
  // references an ERC721 or if TribeController references other addresses).
  // You could call initialization methods here, for example:
  //
  // await tribeController.initializeSomeReference(profileNftMinter.address);
  // await collectibleController.setNFTContract(someNFTContractAddress);

  console.log("All contracts deployed successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Running the Deployment

1. Compile the contracts:

   ```bash
   npx hardhat compile
   ```

2. Deploy to a local Hardhat network:

   ```bash
   npx hardhat run scripts/deploy.js
   ```

3. Deploy to a test network (e.g., Goerli):

   ```bash
   npx hardhat run scripts/deploy.js --network goerli
   ```

---

## 4. Testing

- Create a `test/` directory with JavaScript or TypeScript test files (e.g., `ProfileNFTMinter.test.js`).
- Use Mocha/Chai (built into Hardhat) to write unit tests. For example:

```js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProfileNFTMinter", function () {
  it("Should deploy and mint a profile NFT", async function () {
    const [owner] = await ethers.getSigners();

    const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
    const profileNftMinter = await ProfileNFTMinter.deploy(
      ethers.utils.parseEther("0.01")
    );
    await profileNftMinter.deployed();

    // Attempt to mint without fee should fail
    await expect(
      profileNftMinter.connect(owner).mintProfileNFT("username", "ipfs://avatar")
    ).to.be.revertedWith("Insufficient fee");

    // Provide sufficient fee
    await profileNftMinter.connect(owner).mintProfileNFT(
      "username",
      "ipfs://avatar",
      { value: ethers.utils.parseEther("0.01") }
    );

    // Check minted data
    const userName = await profileNftMinter.profileMetadata(0, "username");
    expect(userName).to.equal("username");
  });
});
```

Run your tests:

```bash
npx hardhat test
```

---

## 5. Additional Integration Notes

- **Wiring Contracts Together**: If your `CollectibleController` or `TribeController` references other contracts (e.g., calls an ERC721 function on `ProfileNFTMinter`), you’ll need to add references in the constructor or via an `initialize` function. For example:
  ```solidity
  constructor(address profileNFTMinterAddress) {
      profileNFTMinter = IProfileNFTMinter(profileNFTMinterAddress);
  }
  ```
- **Access Control**: Many real-world scenarios require `Ownable`, `AccessControl`, or other permissioning logic from OpenZeppelin to restrict function usage to admins or governors.
- **Upgradeability**: If you plan to upgrade, consider using OpenZeppelin’s Upgrades plugin (proxy-based approach) or other solutions like EIP-2535 Diamonds.

---

### You’re All Set!

Following the steps above, you can:

1. Copy the sample contracts from the README into separate Solidity files.
2. Install Hardhat and dependencies.
3. Configure `hardhat.config.js`.
4. Create or copy the `scripts/deploy.js`.
5. Compile and deploy your contracts locally or to a testnet.
6. Write tests in the `test/` folder to ensure correct behavior.

This approach should give you a solid foundation to start developing and expanding the Astrix smart contract suite. Good luck building your decentralized tribe platform!
