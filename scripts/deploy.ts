import { ethers } from "hardhat";

async function main() {
  // Deploy ProfileNFTMinter
  const mintFee = ethers.parseEther("0.01"); // 0.01 ETH mint fee
  const ProfileNFTMinter = await ethers.getContractFactory("ProfileNFTMinter");
  const profileNftMinter = await ProfileNFTMinter.deploy(mintFee);
  await profileNftMinter.waitForDeployment();
  console.log("ProfileNFTMinter deployed to:", await profileNftMinter.getAddress());

  // Deploy TribeController
  const TribeController = await ethers.getContractFactory("TribeController");
  const tribeController = await TribeController.deploy();
  await tribeController.waitForDeployment();
  console.log("TribeController deployed to:", await tribeController.getAddress());

  // Deploy CollectibleController
  const CollectibleController = await ethers.getContractFactory("CollectibleController");
  const collectibleController = await CollectibleController.deploy();
  await collectibleController.waitForDeployment();
  console.log("CollectibleController deployed to:", await collectibleController.getAddress());

  // Deploy PostMinter
  const PostMinter = await ethers.getContractFactory("PostMinter");
  const postMinter = await PostMinter.deploy();
  await postMinter.waitForDeployment();
  console.log("PostMinter deployed to:", await postMinter.getAddress());

  // Deploy Voting
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();
  await voting.waitForDeployment();
  console.log("Voting deployed to:", await voting.getAddress());

  console.log("\nDeployment Summary:");
  console.log("------------------");
  console.log("ProfileNFTMinter:", await profileNftMinter.getAddress());
  console.log("TribeController:", await tribeController.getAddress());
  console.log("CollectibleController:", await collectibleController.getAddress());
  console.log("PostMinter:", await postMinter.getAddress());
  console.log("Voting:", await voting.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 