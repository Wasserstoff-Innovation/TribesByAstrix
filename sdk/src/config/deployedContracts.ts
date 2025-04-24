/**
 * Contains the deployed contract addresses for different networks.
 * This file should be updated after each deployment.
 */

// Removed unused import: import { ethers } from 'ethers';
import { ContractAddresses } from '../types/contracts';
// Removed unused import: import { NetworkId } from './networks';

// Define the type for the map directly (as DeployedContractsMap wasn't exported)
type DeployedContractsMap = { [chainId: number]: ContractAddresses | undefined };

// Default addresses (can be placeholders or from a known deployment)
const DEFAULT_ADDRESSES: ContractAddresses = {
  roleManager: '0x0000000000000000000000000000000000000000',
  tribeController: '0x0000000000000000000000000000000000000000',
  astrixToken: '0x0000000000000000000000000000000000000000',
  tokenDispenser: '0x0000000000000000000000000000000000000000',
  astrixPointSystem: '0x0000000000000000000000000000000000000000',
  collectibleController: '0x0000000000000000000000000000000000000000',
  postFeedManager: '0x0000000000000000000000000000000000000000',
  postMinter: '0x0000000000000000000000000000000000000000',
  profileNFTMinter: '0x0000000000000000000000000000000000000000',
  eventController: '0x0000000000000000000000000000000000000000',
};

// Addresses per network (Chain ID)
export const DEPLOYED_CONTRACTS_MAP: DeployedContractsMap = {
  // Linea Sepolia (Chain ID: 59141)
  59141: {
    roleManager: '0x62A558d6876d32aE65b7455ED0d4f4D5C052f98B',
    tribeController: '0xFc36C9e5f97fdf0c5C26bB98db5Da5c1Ff49B37F',
    astrixToken: '0x7d66e605BD3cd7c41E586d499C3Ddc9F5a4f550F',
    tokenDispenser: '0xce60C30eD2eA0052003CD8D61E8E5c9e10dE723e',
    astrixPointSystem: '0x24a56E469ba83AEdf2696fa48ffE8b78FdaA8Ac9',
    collectibleController: '0x422B3Ded20c1896e3cCa49d586DB91eD3afc452A',
    postFeedManager: '0xa132dd20ddab6e6502B077B8a1c332Af12D528EB',
    profileNFTMinter: '0x23941911f8829248e3Df7F45680DdB6356a948b6',
    eventController: '0xc923e3166CAE8E797E143Cf537c69c83CF9b4840',
    postMinter: '0x654E64E29A09810590e6cA1c138C0125b71c0E1e',
  },
  // Localhost (Chain ID: 31337)
  31337: {
    ...DEFAULT_ADDRESSES
  },
  // Add other networks as needed
};

// Export a function to get addresses by chainId
export function getContractAddressesByChainId(chainId: number): ContractAddresses | undefined {
  return DEPLOYED_CONTRACTS_MAP[chainId];
}

// Export addresses for the default network (optional, could be set via env)
export const DEPLOYED_CONTRACTS = getContractAddressesByChainId(59141) || DEFAULT_ADDRESSES; 