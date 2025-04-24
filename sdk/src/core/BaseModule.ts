import { ethers, InterfaceAbi } from 'ethers';
import { AstrixSDKConfig, ErrorType, CacheOptions } from '../types/core';
import { AstrixSDKError } from '../types/errors';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  blockNumber?: number;
}

/**
 * Base class for all SDK modules with caching support
 */
export abstract class BaseModule {
  protected provider: ethers.JsonRpcProvider;
  protected signer: ethers.Signer | null = null;
  protected config: AstrixSDKConfig;
  
  // Use unknown for cached value type
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private blockListener: (blockNumber: number) => void;
  private currentBlockNumber: number = 0;
  
  // Default cache settings
  private readonly DEFAULT_CACHE_TIME = 30000; // 30 seconds

  /**
   * Create a new module instance
   * @param provider Provider for read operations
   * @param config SDK configuration
   */
  constructor(provider: ethers.JsonRpcProvider, config: AstrixSDKConfig) {
    this.provider = provider;
    this.config = config;
    
    // Create block listener function
    this.blockListener = (blockNumber: number) => {
      this.currentBlockNumber = blockNumber;
      
      // Invalidate cache entries that depend on block number
      this.invalidateBlockBasedCache(blockNumber);
    };
    
    // Set up block monitoring for cache invalidation
    this.setupBlockMonitoring();
  }
  
  /**
   * Sets up block monitoring to invalidate cache based on new blocks
   */
  private setupBlockMonitoring(): void {
    // Clean up any existing subscription
    this.cleanupBlockSubscription();
    
    // Start monitoring blocks
    this.provider.on('block', this.blockListener);
    
    // Initialize current block number
    this.provider.getBlockNumber()
      .then(blockNumber => {
        this.currentBlockNumber = blockNumber;
      })
      .catch(error => {
        this.log(`Error getting initial block number: ${error.message}`);
      });
  }
  
  /**
   * Invalidates cache entries that are bound to specific blocks
   */
  private invalidateBlockBasedCache(currentBlock: number): void {
    for (const [key, entry] of this.cache.entries()) {
      // If this entry has a blockNumber and it's not the current block
      if (entry.blockNumber && entry.blockNumber < currentBlock) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clean up block subscription
   */
  private cleanupBlockSubscription(): void {
    if (this.blockListener) {
      this.provider.off('block', this.blockListener);
    }
  }

  /**
   * Set the signer for write operations
   * @param signer Ethers signer object
   */
  public setSigner(signer: ethers.Signer): void {
    this.signer = signer;
  }

  /**
   * Check if a signer is connected
   */
  protected requireSigner(): ethers.Signer {
    if (!this.signer) {
      throw new AstrixSDKError(
        ErrorType.CONNECTION_ERROR,
        'Signer is required for this operation. Please connect a wallet.'
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.signer!;
  }

  /**
   * Get a contract instance
   * @param address Contract address
   * @param abi Contract ABI
   * @param useSigner Whether to use the signer or provider
   */
  protected getContract<T extends ethers.BaseContract>(
    address: string,
    abi: InterfaceAbi,
    useSigner: boolean = false
  ): T {
    if (useSigner) {
      const signer = this.requireSigner();
      return new ethers.Contract(address, abi, signer) as unknown as T;
    }
    return new ethers.Contract(address, abi, this.provider) as unknown as T;
  }
  
  /**
   * Get cached data or fetch it if not available
   * @param key Cache key
   * @param fetchFn Function to fetch data if not in cache
   * @param options Cache options
   */
  protected async getWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cacheKey = this.buildCacheKey(key);
    const cachedItem = this.cache.get(cacheKey);
    
    // Determine whether to use cache
    const shouldUseCache = this.shouldUseCache(cachedItem, options);
    
    if (shouldUseCache) {
      return cachedItem!.value as T;
    }
    
    // Cache miss or expired, fetch fresh data
    try {
      const result = await fetchFn();
      
      // Store in cache
      this.cache.set(cacheKey, {
        value: result,
        timestamp: Date.now(),
        blockNumber: options?.blockBased ? this.currentBlockNumber : undefined
      });
      
      return result;
    } catch (error: unknown) {
      this.handleError(error, `Failed to fetch data for cache key: ${cacheKey}`);
      throw error;
    }
  }
  
  /**
   * Determine if cached data should be used
   */
  private shouldUseCache(
    cachedItem: CacheEntry<unknown> | undefined,
    options?: CacheOptions
  ): boolean {
    if (!cachedItem) return false;
    
    // If caching is disabled
    if (options?.disabled) return false;
    
    // If block-based caching is used
    if (options?.blockBased && cachedItem.blockNumber !== undefined) {
      return cachedItem.blockNumber === this.currentBlockNumber;
    }
    
    // Time-based caching
    const maxAge = options?.maxAge || this.config.cache?.defaultMaxAge || this.DEFAULT_CACHE_TIME;
    const now = Date.now();
    const age = now - cachedItem.timestamp;
    
    return age < maxAge;
  }
  
  /**
   * Build a standardized cache key
   */
  private buildCacheKey(key: string): string {
    const chainId = this.config.chainId || 'unknown';
    return `${chainId}:${key}`;
  }
  
  /**
   * Invalidate a specific cache entry
   * @param key Cache key to invalidate
   */
  protected invalidateCache(key: string): void {
    const cacheKey = this.buildCacheKey(key);
    this.cache.delete(cacheKey);
  }
  
  /**
   * Invalidate cache entries that match a pattern
   * @param pattern Pattern to match cache keys against
   */
  protected invalidateCacheByPattern(pattern: string): void {
    const prefix = this.config.chainId ? `${this.config.chainId}:` : '';
    const fullPattern = `${prefix}${pattern}`;
    
    for (const key of this.cache.keys()) {
      if (key.includes(fullPattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear all cached data
   */
  protected clearCache(): void {
    this.cache.clear();
  }

  /**
   * Handle errors by wrapping them in AstrixSDKError
   * @param error Original error
   * @param message Error message
   * @param type Error type
   */
  protected handleError(
    error: unknown,
    message: string = 'Operation failed',
    type: ErrorType = ErrorType.CONTRACT_ERROR
  ): never {
    if (error instanceof AstrixSDKError) {
      throw error;
    }
    
    let errorMessage = message;
    let code = ErrorType.SDK_ERROR; // Default to SDK_ERROR

    // Try to extract code and reason from ethers error
    if (typeof error === 'object' && error !== null) {
        const ethersError = error as any; // Cast to any for property access
        if (ethersError.code) {
            // Use the specific ethers code if available, otherwise keep SDK_ERROR
            code = ethersError.code; 
        } else {
            code = ErrorType.SDK_ERROR; // Fallback if code property doesn't exist
        }
        if (ethersError.reason) {
            errorMessage += `: ${ethersError.reason}`;
        } else if (ethersError.message) {
             errorMessage += `: ${ethersError.message}`;
        }
    } else {
        code = ErrorType.SDK_ERROR; // Fallback for non-object errors
    }

    throw new AstrixSDKError(type, errorMessage, code, error);
  }

  /**
   * Log a message if verbose mode is enabled
   * @param message Message to log
   * @param data Optional data to log
   */
  protected log(_message: string, _data?: Record<string, unknown> | string | number): void {
    // Logging is currently disabled within the SDK itself.
    // Consuming applications can implement their own logging if needed.
    // if (this.config.verbose) {
      // console.log(`[Astrix SDK] ${message}`);
      // if (data !== undefined) {
      //   console.log(data);
      // }
    // } 
  }
  
  /**
   * Dispose of resources and subscriptions
   */
  public dispose(): void {
    this.cleanupBlockSubscription();
    this.clearCache();
  }
} 