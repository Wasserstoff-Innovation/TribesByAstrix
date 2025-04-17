/**
 * Deposit parameters
 */
export interface DepositParams {
  /**
   * Amount of tokens to deposit in wei
   */
  amount: bigint;
}

/**
 * Withdrawal parameters
 */
export interface WithdrawParams {
  /**
   * Amount of tokens to withdraw in wei
   */
  amount: bigint;
}

/**
 * Organization admin update parameters
 */
export interface UpdateOrganizationAdminParams {
  /**
   * New admin address
   */
  newAdmin: string;
}

/**
 * Parameters for spending with signature
 */
export interface SpendWithSignatureParams {
  /**
   * Organization address
   */
  organization: string;
  
  /**
   * Recipient address
   */
  recipient: string;
  
  /**
   * Amount to spend in wei
   */
  amount: bigint;
  
  /**
   * Reason for the spend
   */
  reason: string;
  
  /**
   * Signature from the organization admin
   */
  signature: string;
}

/**
 * Parameters for platform spending
 */
export interface PlatformSpendParams {
  /**
   * Organization address
   */
  organization: string;
  
  /**
   * Recipient address
   */
  recipient: string;
  
  /**
   * Amount to spend in wei
   */
  amount: bigint;
  
  /**
   * Reason for the spend
   */
  reason: string;
}

/**
 * Balance response
 */
export interface BalanceResponse {
  /**
   * Token balance in wei
   */
  balance: bigint;
  
  /**
   * Formatted balance in Astrix tokens
   */
  formattedBalance: string;
}

/**
 * Astrix token information
 */
export interface TokenInfo {
  /**
   * Token name
   */
  name: string;
  
  /**
   * Token symbol
   */
  symbol: string;
  
  /**
   * Total supply in wei
   */
  totalSupply: bigint;
  
  /**
   * Formatted total supply
   */
  formattedTotalSupply: string;
  
  /**
   * Maximum supply in wei
   */
  maxSupply: bigint;
  
  /**
   * Formatted maximum supply
   */
  formattedMaxSupply: string;
  
  /**
   * Remaining supply that can be minted in wei
   */
  remainingSupply: bigint;
  
  /**
   * Formatted remaining supply
   */
  formattedRemainingSupply: string;
  
  /**
   * Percentage of tokens minted (0-100)
   */
  percentMinted: number;
} 