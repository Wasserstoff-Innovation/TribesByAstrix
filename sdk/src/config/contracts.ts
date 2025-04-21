/**
 * Contract addresses configuration for Tribes by Astrix SDK
 */
import { NetworkId, chainIdToNetworkId } from './networks';
import { ContractAddresses } from '../types/contracts';

/**
 * Contract addresses for each supported network
 */
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  [NetworkId.MAINNET]: {
    roleManager: '0x...',
    tribeController: '0x...',
    astrixToken: '0x...',
    tokenDispenser: '0x...',
    astrixPointSystem: '0x...',
    collectibleController: '0x...',
    postFeedManager: '0x...',
    postMinter: '0x...',
    profileNFTMinter: '0x...'
  },
  [NetworkId.POLYGON]: {
    roleManager: '0x...',
    tribeController: '0x...',
    astrixToken: '0x...',
    tokenDispenser: '0x...',
    astrixPointSystem: '0x...',
    collectibleController: '0x...',
    postFeedManager: '0x...',
    postMinter: '0x...',
    profileNFTMinter: '0x...'
  },
  [NetworkId.MUMBAI]: {
    roleManager: '0x...',
    tribeController: '0x...',
    astrixToken: '0x...',
    tokenDispenser: '0x...',
    astrixPointSystem: '0x...',
    collectibleController: '0x...',
    postFeedManager: '0x...',
    postMinter: '0x...',
    profileNFTMinter: '0x...'
  },
  [NetworkId.MONAD_TESTNET]: {
    roleManager: '0x0000000000000000000000000000000000000001',
    tribeController: '0x0000000000000000000000000000000000000002',
    astrixToken: '0x0000000000000000000000000000000000000003',
    tokenDispenser: '0x0000000000000000000000000000000000000004',
    astrixPointSystem: '0x0000000000000000000000000000000000000005',
    collectibleController: '0x0000000000000000000000000000000000000006',
    postFeedManager: '0x0000000000000000000000000000000000000007',
    postMinter: '0x0000000000000000000000000000000000000008',
    profileNFTMinter: '0x0000000000000000000000000000000000000009'
  },
  [NetworkId.LOCAL]: {
    roleManager: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    tribeController: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    astrixToken: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    tokenDispenser: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    astrixPointSystem: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
    collectibleController: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
    postFeedManager: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    postMinter: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    profileNFTMinter: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6'
  }
};

/**
 * Get contract addresses for a specific network ID
 * @param networkId The network ID to get addresses for
 * @returns Contract addresses for the specified network
 */
export function getContractAddresses(networkId: NetworkId): ContractAddresses {
  return CONTRACT_ADDRESSES[networkId];
}

/**
 * Get contract addresses for a specific chain ID
 * @param chainId The chain ID to get addresses for
 * @returns Contract addresses for the specified chain ID
 */
export function getContractAddressesByChainId(chainId: number): ContractAddresses | undefined {
  const networkId = chainIdToNetworkId(chainId);
  
  if (networkId === undefined) {
    return undefined;
  }
  
  return CONTRACT_ADDRESSES[networkId];
} 