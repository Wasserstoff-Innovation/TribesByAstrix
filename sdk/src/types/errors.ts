import { ErrorType } from './core';

/**
 * Custom error class for the SDK
 */
export class AstrixSDKError extends Error {
  /**
   * Error type
   */
  public type: ErrorType;
  
  /**
   * Original error
   */
  public originalError?: any;
  
  /**
   * Additional details
   */
  public details?: any;

  constructor(type: ErrorType, message: string, details?: any, originalError?: any) {
    super(message);
    this.name = 'AstrixSDKError';
    this.type = type;
    this.details = details;
    this.originalError = originalError;
    
    // This is necessary for proper instanceof checking in TypeScript
    Object.setPrototypeOf(this, AstrixSDKError.prototype);
  }

  /**
   * Convert to string representation
   */
  public toString(): string {
    return `[${this.type}] ${this.message}${this.details ? ` - ${JSON.stringify(this.details)}` : ''}`;
  }

  /**
   * Convert to plain object
   */
  public toObject(): any {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      stack: this.stack
    };
  }
} 