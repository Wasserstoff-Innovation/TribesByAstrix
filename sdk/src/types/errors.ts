import { ErrorType } from './core';

/**
 * Custom error class for the SDK
 */
export class AstrixSDKError extends Error {
  /**
   * Error type
   */
  public readonly type: ErrorType;
  
  /**
   * Original error
   */
  public readonly originalError?: unknown;
  
  /**
   * Additional details
   */
  public readonly data?: unknown;

  constructor(
    type: ErrorType,
    message: string,
    code?: string | number,
    data?: unknown,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'AstrixSDKError';
    this.type = type;
    this.data = data;
    this.originalError = originalError;
    
    // This is necessary for proper instanceof checking in TypeScript
    Object.setPrototypeOf(this, AstrixSDKError.prototype);
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    return `[${this.type}] ${this.message}${this.data ? ` - ${JSON.stringify(this.data)}` : ''}`;
  }

  /**
   * Convert to plain object
   */
  public toObject(): Record<string, unknown> {
    return {
      type: this.type,
      message: this.message,
      data: this.data,
      stack: this.stack
    };
  }
}

export function fromError(error: unknown, defaultMessage: string = 'An unknown error occurred'): AstrixSDKError {
  if (error instanceof AstrixSDKError) {
    return error;
  }
  
  // Basic error handling for common types
  if (error instanceof Error) {
      // Extract code if it exists (might be custom or from ethers)
      const code = (error as any).code || ErrorType.SDK_ERROR;
      return new AstrixSDKError(
          ErrorType.SDK_ERROR, 
          `${defaultMessage}: ${error.message}`,
          code,
          undefined, 
          error
      );
  }

  return new AstrixSDKError(
      ErrorType.SDK_ERROR,
      defaultMessage,
      undefined,
      error, 
      error
  );
}

export function handleError(error: unknown, message: string, _type: ErrorType): never {
  if (error instanceof AstrixSDKError) {
    throw error;
  }
  throw fromError(error, message);
} 