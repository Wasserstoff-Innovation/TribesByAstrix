/**
 * Network types for Tribes by Astrix SDK
 */

/**
 * Supported network types
 */
export type NetworkType = 'mainnet' | 'testnet' | 'devnet' | 'local';

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: number;
  name: string;
  type: NetworkType;
  rpcUrl?: string;
  explorerUrl?: string;
}

/**
 * Network details by chain ID
 */
export interface NetworkDetails {
  [chainId: number]: NetworkConfig;
}

/**
 * Supported networks
 */
export const SUPPORTED_NETWORKS: NetworkDetails = {
  // Mainnet
  1: {
    chainId: 1,
    name: 'Ethereum',
    type: 'mainnet',
    explorerUrl: 'https://etherscan.io'
  },
  // Linea
  59144: {
    chainId: 59144,
    name: 'Linea',
    type: 'mainnet',
    explorerUrl: 'https://lineascan.build'
  },
  // Testnet
  59141: {
    chainId: 59141,
    name: 'Linea Sepolia',
    type: 'testnet',
    explorerUrl: 'https://sepolia.lineascan.build'
  },
  // Localhost
  31337: {
    chainId: 31337,
    name: 'Hardhat',
    type: 'local'
  }
}; 