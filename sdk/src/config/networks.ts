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
  MONAD_TESTNET = 4165,
  MONAD_MAINNET = 1284,
  XDC_TESTNET = 51,
  XDC_MAINNET = 50,
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
    case NetworkId.MONAD_TESTNET:
      return 'Monad Testnet';
    case NetworkId.MONAD_MAINNET:
      return 'Monad Mainnet';
    case NetworkId.XDC_TESTNET:
      return 'XDC Apothem Testnet';
    case NetworkId.XDC_MAINNET:
      return 'XDC Mainnet';
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
    case 4165:
      return NetworkId.MONAD_TESTNET;
    case 1284:
      return NetworkId.MONAD_MAINNET;
    case 51:
      return NetworkId.XDC_TESTNET;
    case 50:
      return NetworkId.XDC_MAINNET;
    case 31337:
      return NetworkId.LOCAL;
    default:
      return undefined;
  }
} 