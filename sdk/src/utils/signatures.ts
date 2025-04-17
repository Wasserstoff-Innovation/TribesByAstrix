import { ethers } from 'ethers';

/**
 * Create a signature for spending tokens on behalf of an organization
 * @param signer Signer to sign the message
 * @param organization Organization address
 * @param recipient Recipient address
 * @param amount Amount to spend
 * @param reason Reason for spending
 * @returns Signature that can be used with spendWithSignature
 */
export async function createSpendSignature(
  signer: ethers.Signer,
  organization: string,
  recipient: string,
  amount: bigint,
  reason: string
): Promise<string> {
  // Create message hash (matches the one in TokenDispenser.sol)
  const messageHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint256', 'string'],
      [organization, recipient, amount, reason]
    )
  );
  
  // Create Ethereum signed message
  const signature = await signer.signMessage(ethers.getBytes(messageHash));
  
  return signature;
}

/**
 * Create a signature for point redemption
 * @param signer Signer to sign the message
 * @param user User address
 * @param points Number of points
 * @param collectibleType Type of collectible
 * @returns Signature that can be used with redeemPoints
 */
export async function createPointRedemptionSignature(
  signer: ethers.Signer,
  user: string,
  points: number,
  collectibleType: number
): Promise<string> {
  // Create message hash (matches the one in CommunityPoints.sol)
  const messageHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'uint256'],
      [user, points, collectibleType]
    )
  );
  
  // Create Ethereum signed message
  const signature = await signer.signMessage(ethers.getBytes(messageHash));
  
  return signature;
}

/**
 * Verify a signature for spending tokens
 * @param signature Signature to verify
 * @param organization Organization address
 * @param recipient Recipient address
 * @param amount Amount to spend
 * @param reason Reason for spending
 * @returns Address of the signer
 */
export function verifySpendSignature(
  signature: string,
  organization: string,
  recipient: string,
  amount: bigint,
  reason: string
): string {
  // Create message hash (matches the one in TokenDispenser.sol)
  const messageHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'uint256', 'string'],
      [organization, recipient, amount, reason]
    )
  );
  
  // Recover signer
  const signer = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
  
  return signer;
}

/**
 * Verify a signature for point redemption
 * @param signature Signature to verify
 * @param user User address
 * @param points Number of points
 * @param collectibleType Type of collectible
 * @returns Address of the signer
 */
export function verifyPointRedemptionSignature(
  signature: string,
  user: string,
  points: number,
  collectibleType: number
): string {
  // Create message hash (matches the one in CommunityPoints.sol)
  const messageHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'uint256'],
      [user, points, collectibleType]
    )
  );
  
  // Recover signer
  const signer = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
  
  return signer;
} 