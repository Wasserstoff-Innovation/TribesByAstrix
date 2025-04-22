/**
 * Tribes by Astrix SDK
 * A comprehensive SDK for integrating with the Tribes by Astrix platform
 */

// Core
import { BaseModule } from './core/BaseModule';
import { AstrixSDK } from './core/AstrixSDK';
import { PointsModule } from './modules/points';
import { TokenModule } from './modules/token';
import { ContentModule } from './modules/content';
import { ProfilesModule } from './modules/profiles';
import { TribesModule } from './modules/tribes';
import { OrganizationsModule } from './modules/organizations';
import { AnalyticsModule } from './modules/analytics';

// export * from './core/AstrixSDK'; // Need to fix circular dependency issues
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
import { AstrixSDKConfig, ErrorType } from './types/core';
import { AstrixSDKError } from './types/errors';
import { NetworkType } from './types/networks';
import { ContractAddresses } from './types/contracts';
import { ActionType, ActionPoints, TokenInfo } from './types/points';
import { TribeInfo, TribeMemberInfo } from './types/tribes';
import { PostType, PostContent, PostInfo } from './types/content';
import { ProfileInfo } from './types/profiles';
import { OrganizationInfo } from './types/organizations';

// Contract types with explicit re-export to avoid ambiguity
export {
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

// Commenting out the default export to avoid circular dependency
// import AstrixSDK from './core/AstrixSDK';
// export default AstrixSDK;
// Instead, export individual modules and the AstrixSDK class

export {
  // Core classes
  AstrixSDK,
  BaseModule,
  
  // Modules
  PointsModule,
  TokenModule,
  ContentModule,
  ProfilesModule,
  TribesModule,
  OrganizationsModule,
  AnalyticsModule,
  
  // Types
  AstrixSDKConfig,
  ErrorType,
  AstrixSDKError,
  NetworkType,
  ContractAddresses,
  ActionType,
  ActionPoints,
  TokenInfo,
  TribeInfo,
  TribeMemberInfo,
  PostType,
  PostContent,
  PostInfo,
  ProfileInfo,
  OrganizationInfo
}; 