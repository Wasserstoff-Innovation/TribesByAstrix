import { ethers } from 'ethers';
import { ErrorType } from '../types/core';
import { AstrixSDKError } from '../types/errors';

/**
 * Validate an Ethereum address
 * @param address Address to validate
 * @param paramName Parameter name for error messages
 * @throws AstrixSDKError if the address is invalid
 */
export function validateAddress(address: string, paramName: string = 'address'): void {
  if (!address || !ethers.isAddress(address)) {
    throw new AstrixSDKError(
      ErrorType.VALIDATION_ERROR,
      `Invalid ${paramName}: ${address}`
    );
  }

  if (address === ethers.ZeroAddress) {
    throw new AstrixSDKError(
      ErrorType.VALIDATION_ERROR,
      `${paramName} cannot be zero address`
    );
  }
}

/**
 * Validate a number is positive
 * @param value Value to validate
 * @param paramName Parameter name for error messages
 * @throws AstrixSDKError if the value is not positive
 */
export function validatePositiveNumber(value: number, paramName: string = 'value'): void {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    throw new AstrixSDKError(
      ErrorType.VALIDATION_ERROR,
      `${paramName} must be a positive number`
    );
  }
}

/**
 * Validate a bigint is positive
 * @param value Value to validate
 * @param paramName Parameter name for error messages
 * @throws AstrixSDKError if the value is not positive
 */
export function validatePositiveBigInt(value: bigint, paramName: string = 'value'): void {
  if (typeof value !== 'bigint' || value <= 0n) {
    throw new AstrixSDKError(
      ErrorType.VALIDATION_ERROR,
      `${paramName} must be a positive bigint`
    );
  }
}

/**
 * Validate a string is not empty
 * @param value Value to validate
 * @param paramName Parameter name for error messages
 * @throws AstrixSDKError if the string is empty
 */
export function validateNonEmptyString(value: string, paramName: string = 'value'): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AstrixSDKError(
      ErrorType.VALIDATION_ERROR,
      `${paramName} must be a non-empty string`
    );
  }
}

/**
 * Validate an array is not empty
 * @param array Array to validate
 * @param paramName Parameter name for error messages
 * @throws AstrixSDKError if the array is empty
 */
export function validateNonEmptyArray(array: any[], paramName: string = 'array'): void {
  if (!Array.isArray(array) || array.length === 0) {
    throw new AstrixSDKError(
      ErrorType.VALIDATION_ERROR,
      `${paramName} must be a non-empty array`
    );
  }
}

/**
 * Validate a token amount
 * @param amount Amount to validate
 * @param paramName Parameter name for error messages
 * @throws AstrixSDKError if the amount is invalid
 */
export function validateTokenAmount(amount: bigint, paramName: string = 'amount'): void {
  validatePositiveBigInt(amount, paramName);

  // Check for ridiculously large values that might indicate a mistake
  if (amount > 2n**128n) {
    throw new AstrixSDKError(
      ErrorType.VALIDATION_ERROR,
      `${paramName} is unreasonably large, might be a mistake`
    );
  }
}

/**
 * Validate tribe parameters
 * @param tribeId Tribe ID to validate
 * @throws AstrixSDKError if the tribe ID is invalid
 */
export function validateTribeId(tribeId: number): void {
  if (typeof tribeId !== 'number' || isNaN(tribeId) || tribeId < 1 || !Number.isInteger(tribeId)) {
    throw new AstrixSDKError(
      ErrorType.VALIDATION_ERROR,
      `Invalid tribe ID: ${tribeId}. Must be a positive integer.`
    );
  }
}

/**
 * Check if a value is an object
 * @param obj Object to check
 */
export function isObject(obj: Record<string, unknown>): boolean {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
} 