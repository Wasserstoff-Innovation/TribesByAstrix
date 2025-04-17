import { ethers } from 'ethers';
import { AstrixSDKConfig, ErrorType } from '../types/core';
import { AstrixSDKError } from '../types/errors';

/**
 * Base class for all SDK modules
 */
export abstract class BaseModule {
  protected provider: ethers.JsonRpcProvider;
  protected signer: ethers.Signer | null = null;
  protected config: AstrixSDKConfig;

  /**
   * Create a new module instance
   * @param provider Provider for read operations
   * @param config SDK configuration
   */
  constructor(provider: ethers.JsonRpcProvider, config: AstrixSDKConfig) {
    this.provider = provider;
    this.config = config;
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
        ErrorType.UNAUTHORIZED,
        'No signer connected. Please call connect() first.'
      );
    }
    return this.signer;
  }

  /**
   * Get a contract instance
   * @param address Contract address
   * @param abi Contract ABI
   * @param useSigner Whether to use the signer or provider
   */
  protected getContract<T extends ethers.BaseContract>(
    address: string,
    abi: any,
    useSigner: boolean = false
  ): T {
    if (useSigner) {
      const signer = this.requireSigner();
      return new ethers.Contract(address, abi, signer) as unknown as T;
    }
    return new ethers.Contract(address, abi, this.provider) as unknown as T;
  }

  /**
   * Handle errors by wrapping them in AstrixSDKError
   * @param error Original error
   * @param message Error message
   * @param type Error type
   */
  protected handleError(
    error: any,
    message: string = 'Operation failed',
    type: ErrorType = ErrorType.CONTRACT_ERROR
  ): never {
    // Check if error is already an AstrixSDKError
    if (error instanceof AstrixSDKError) {
      throw error;
    }

    // Handle specific error types
    if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new AstrixSDKError(
        ErrorType.INSUFFICIENT_FUNDS,
        'Insufficient funds for transaction',
        undefined,
        error
      );
    }

    if (error.code === 'TIMEOUT') {
      throw new AstrixSDKError(
        ErrorType.TIMEOUT,
        'Transaction timed out',
        undefined,
        error
      );
    }

    // Extract error message if available
    let errorMessage = message;
    if (error.reason) {
      errorMessage += `: ${error.reason}`;
    } else if (error.message) {
      errorMessage += `: ${error.message}`;
    }

    throw new AstrixSDKError(type, errorMessage, undefined, error);
  }

  /**
   * Log a message if verbose mode is enabled
   * @param message Message to log
   * @param data Optional data to log
   */
  protected log(message: string, data?: any): void {
    if (this.config.verbose) {
      console.log(`[Astrix SDK] ${message}`);
      if (data !== undefined) {
        console.log(data);
      }
    }
  }
} 