/**
 * Tribes by Astrix SDK
 * A comprehensive SDK for integrating with the Tribes by Astrix platform
 */

// Core
// export * from './core/AstrixSDK'; // Need to fix circular dependency issues
export * from './core/BaseModule';
// export * from './core/Config'; // File missing

// Config exports
export { 
  getContractAddresses,
  getContractAddressesByChainId
} from './config/contracts';
export { 
  NetworkId,
  getNetworkName,
  chainIdToNetworkId
} from './config/networks';
export { DEPLOYED_CONTRACTS } from './config/deployedContracts';

// Types
export * from './types/core';  // Required by BaseModule and error handling
export * from './types/errors'; // Required for error handling

// Contract types with explicit re-export to avoid ambiguity
export {
  ContractAddresses,
  InteractionCounts,
  ContractPost,
  ContractBatchPostData,
  ContractPostPaginationResult,
  isPostCreatedEvent,
  isBatchPostsCreatedEvent,
  isEncryptedPostCreatedEvent,
  isSignatureGatedPostCreatedEvent
} from './types/contracts';

// Content module types
export * from './types/content';  // Types for Content module (fully implemented)

// Types for Profiles module
export * from './types/profiles';

// Modules
// Per user request, tribes module is removed
// export * from './modules/tribes';

// Implementation note:
// The points and token modules depend on types/core which needs to be fixed
export * from './modules/points';
export * from './modules/token';
export * from './modules/content';  // Content module is fully implemented

// Auxiliary modules that may have dependencies needing resolution
export * from './modules/profiles';
export * from './modules/organizations';
export * from './modules/analytics';

// Utilities - need to be refactored to resolve circular dependencies
// export * from './utils/signatures';
// export * from './utils/validation';
export * from './utils/formatting';

// Constants and helpers
export const SDK_VERSION = '1.0.1';
export const DEFAULT_GAS_LIMIT = 500000;  