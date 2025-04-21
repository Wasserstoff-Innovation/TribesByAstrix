/**
 * Network configuration for Tribes by Astrix SDK
 */

/**
 * Network ID definitions for the Tribes by Astrix platform
 */

/**
 * Supported network IDs
 */
export enum NetworkId {
  MAINNET = 1,
  POLYGON = 137,
  MUMBAI = 80001,
  MONAD_DEVNET = 125999,
  LOCAL = 31337
}

/**
 * Get the name of a network by its ID
 */
export function getNetworkName(networkId: NetworkId): string {
  switch (networkId) {
    case NetworkId.MAINNET:
      return 'Ethereum Mainnet';
    case NetworkId.POLYGON:
      return 'Polygon Mainnet';
    case NetworkId.MUMBAI:
      return 'Polygon Mumbai';
    case NetworkId.MONAD_DEVNET:
      return 'Monad Devnet';
    case NetworkId.LOCAL:
      return 'Local Development';
    default:
      return 'Unknown Network';
  }
}

/**
 * Map a chain ID to a network ID
 * @param chainId The chain ID to map
 * @returns The corresponding network ID or undefined if not supported
 */
export function chainIdToNetworkId(chainId: number): NetworkId | undefined {
  switch (chainId) {
    case 1:
      return NetworkId.MAINNET;
    case 137:
      return NetworkId.POLYGON;
    case 80001:
      return NetworkId.MUMBAI;
    case 125999:
      return NetworkId.MONAD_DEVNET;
    case 31337:
      return NetworkId.LOCAL;
    default:
      return undefined;
  }
} 