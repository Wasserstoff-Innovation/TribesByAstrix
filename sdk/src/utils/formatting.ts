import { ethers } from 'ethers';

/**
 * Format a token amount to a human-readable string
 * @param amount Amount in wei
 * @param decimals Number of decimals
 * @param symbol Token symbol
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = 18,
  symbol?: string
): string {
  const formattedAmount = ethers.formatUnits(amount, decimals);
  
  if (symbol) {
    return `${formattedAmount} ${symbol}`;
  }
  
  return formattedAmount;
}

/**
 * Format an address with truncation
 * @param address Address to format
 * @param prefixLength Number of characters to keep at the beginning
 * @param suffixLength Number of characters to keep at the end
 */
export function formatAddress(
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4
): string {
  if (!address || !ethers.isAddress(address)) {
    return address;
  }
  
  const start = address.slice(0, prefixLength + 2); // +2 for '0x'
  const end = address.slice(-suffixLength);
  
  return `${start}...${end}`;
}

/**
 * Format a date to ISO string or custom format
 * @param timestamp Timestamp in seconds
 * @param format Format string (currently only supports 'iso')
 */
export function formatDate(
  timestamp: number,
  format: 'iso' | 'relative' = 'iso'
): string {
  // Convert to milliseconds if it's in seconds
  const ts = timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
  const date = new Date(ts);
  
  if (format === 'relative') {
    const now = Date.now();
    const diff = now - ts;
    
    // Calculate relative time
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    }
  }
  
  return date.toISOString();
}

/**
 * Format a number with thousand separators
 * @param value Number to format
 * @param decimals Number of decimal places
 */
export function formatNumber(
  value: number,
  decimals: number = 0
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format a percentage
 * @param value Percentage value (0-100)
 * @param decimals Number of decimal places
 */
export function formatPercentage(
  value: number,
  decimals: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
} 