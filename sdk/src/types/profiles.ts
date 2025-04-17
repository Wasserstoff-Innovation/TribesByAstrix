/**
 * Parameters for creating a profile
 */
export interface CreateProfileParams {
  /**
   * Unique username
   */
  username: string;
  
  /**
   * Profile metadata (JSON string)
   */
  metadata: string;
}

/**
 * Parameters for updating profile metadata
 */
export interface UpdateProfileMetadataParams {
  /**
   * Profile token ID
   */
  profileId: number;
  
  /**
   * New profile metadata
   */
  metadata: string;
}

/**
 * Profile data
 */
export interface ProfileData {
  /**
   * Profile ID
   */
  id: number;
  
  /**
   * Owner address
   */
  owner: string;
  
  /**
   * Username
   */
  username: string;
  
  /**
   * Profile metadata
   */
  metadata: string;
} 