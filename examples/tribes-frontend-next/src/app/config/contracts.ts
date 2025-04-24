/**
 * Contract addresses for different networks
 */

export interface ContractAddresses {
  roleManager: string;
  tribeController: string;
  astrixToken: string;
  tokenDispenser: string;
  astrixPointSystem: string;
  profileNFTMinter?: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  contracts: ContractAddresses;
}

export const NETWORKS: Record<string, NetworkConfig> = {
  // Linea Sepolia Testnet
  lineaSepolia: {
    chainId: 59141,
    name: 'Linea Sepolia',
    rpcUrl: 'https://rpc.sepolia.linea.build',
    explorerUrl: 'https://sepolia.lineascan.build',
    contracts: {
      roleManager: '0xf861Be4513CA56F1b9FDf8bB4F466e28401776a5',
      tribeController: '0xea38fDF78E936EA181F8e916E07498BFb7a17BB6',
      astrixToken: '0xC0E537526B4ddaF99C39736FE7Ca22641Fd30B18',
      tokenDispenser: '0xc84B8e6cA9758BC93112794c25106A01459724d0',
      astrixPointSystem: '0xAA7d78B91290f343b89Cc36CAeF7A3c272C0524A',
      // No ProfileNFTMinter deployed in this run due to contract size restrictions
    }
  },
  // Linea Mainnet
  linea: {
    chainId: 59144,
    name: 'Linea',
    rpcUrl: 'https://rpc.linea.build',
    explorerUrl: 'https://lineascan.build',
    contracts: {
      roleManager: '0xa8A8f9d1AC8BFf08E3c26eAe06b24F0AE4CB07F5',
      tribeController: '0x95B95a11CEd219f72E7D38C95d943DE09a4BB24A',
      astrixToken: '0xeE4AcB16Ba3Fd385D17D25aD5E28C742dF894b19',
      tokenDispenser: '0xd85F25e9D941D9D6B9a9BBA3d1df40a12d621bB2',
      astrixPointSystem: '0xB5A14D506A3a9F58A67bbD11b58CB366E7Bdd74D',
      profileNFTMinter: '0x2b30e20C88957F58e67ec8ed4c8538E48E501b23'
    }
  }
};

/**
 * Get contract addresses for a specific chain ID
 */
export function getContractAddressesByChainId(chainId: number): ContractAddresses | undefined {
  const network = Object.values(NETWORKS).find(net => net.chainId === chainId);
  return network?.contracts;
}

/**
 * Get default network configuration
 */
export function getDefaultNetwork(): NetworkConfig {
  return NETWORKS.lineaSepolia;
}

/**
 * Get network configuration by chain ID
 */
export function getNetworkByChainId(chainId: number): NetworkConfig | undefined {
  return Object.values(NETWORKS).find(net => net.chainId === chainId);
} 