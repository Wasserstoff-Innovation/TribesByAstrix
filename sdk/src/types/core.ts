import { ethers } from 'ethers';
import { ContractAddresses } from './contracts';

/**
 * Configuration options for the SDK
 */
export interface AstrixSDKConfig {
  /**
   * Ethereum provider URL or provider instance
   */
  provider: string | ethers.JsonRpcProvider;

  /**
   * Contract addresses for the Astrix ecosystem
   */
  contracts: ContractAddresses;

  /**
   * Optional chain ID
   */
  chainId?: number;

  /**
   * Optional API key for additional services
   */
  apiKey?: string;

  /**
   * Optional timeout for transactions in milliseconds
   */
  timeout?: number;

  /**
   * Optional flag to enable verbose logging
   */
  verbose?: boolean;
  
  /**
   * Optional cache configuration
   */
  cache?: CacheConfig;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /**
   * Whether to disable caching globally
   */
  disabled?: boolean;
  
  /**
   * Default maximum age for cached items in milliseconds
   */
  defaultMaxAge?: number;
  
  /**
   * Whether to use block-based caching by default
   */
  defaultBlockBased?: boolean;
}

/**
 * Options for individual cache operations
 */
export interface CacheOptions {
  /**
   * Whether this specific cache operation should be disabled
   */
  disabled?: boolean;
  
  /**
   * Maximum age for this cached item in milliseconds
   */
  maxAge?: number;
  
  /**
   * Whether to use block-based caching for this item
   * If true, the item will be invalidated when a new block is mined
   */
  blockBased?: boolean;
}

/**
 * Error types for the SDK
 */
export enum ErrorType {
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TIMEOUT = 'TIMEOUT',
  API_ERROR = 'API_ERROR',
  SDK_ERROR = 'SDK_ERROR'
}

/**
 * Custom error object for the SDK
 */
export interface AstrixError {
  type: ErrorType;
  message: string;
  details?: any;
  originalError?: any;
}

/**
 * Transaction receipt with additional context
 */
export interface EnhancedTransactionReceipt extends ethers.TransactionReceipt {
  /**
   * Transaction hash
   */
  hash: string;

  /**
   * Decoded events from the transaction receipt
   */
  decodedEvents?: any[];

  /**
   * Status of the transaction
   */
  status: number | null;
} 