/**
 * Action types for the point system
 */
export enum ActionType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
  QUIZ = 'QUIZ',
  POLL = 'POLL',
  CUSTOM = 'CUSTOM'
}

/**
 * Parameters for setting a tribe organization
 */
export interface SetTribeOrganizationParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Organization address
   */
  organization: string;
}

/**
 * Parameters for setting an exchange rate
 */
export interface SetExchangeRateParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Exchange rate (tribe tokens per 1 Astrix token)
   */
  rate: number;
}

/**
 * Parameters for creating a tribe token
 */
export interface CreateTribeTokenParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Token name
   */
  name: string;
  
  /**
   * Token symbol
   */
  symbol: string;
}

/**
 * Parameters for setting action points
 */
export interface SetActionPointsParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Action type
   */
  actionType: ActionType | string;
  
  /**
   * Points value
   */
  points: number;
}

/**
 * Parameters for awarding points
 */
export interface AwardPointsParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Member address
   */
  member: string;
  
  /**
   * Points to award
   */
  points: number;
  
  /**
   * Action type
   */
  actionType: ActionType | string;
}

/**
 * Parameters for deducting points
 */
export interface DeductPointsParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Member address
   */
  member: string;
  
  /**
   * Points to deduct
   */
  points: number;
  
  /**
   * Reason for deduction
   */
  reason: string;
}

/**
 * Parameters for recording an action
 */
export interface RecordActionParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Member address
   */
  member: string;
  
  /**
   * Action type
   */
  actionType: ActionType | string;
}

/**
 * Parameters for batch awarding points
 */
export interface BatchAwardPointsParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Array of member addresses
   */
  members: string[];
  
  /**
   * Points to award
   */
  points: number;
  
  /**
   * Action type
   */
  actionType: ActionType | string;
}

/**
 * Parameters for exchanging Astrix tokens for tribe tokens
 */
export interface ExchangeTokensParams {
  /**
   * Tribe ID
   */
  tribeId: number;
  
  /**
   * Amount of Astrix tokens to exchange in wei
   */
  astrixAmount: bigint;
}

/**
 * Top member response
 */
export interface TopMemberResponse {
  /**
   * Member address
   */
  address: string;
  
  /**
   * Points balance
   */
  points: number;
} 