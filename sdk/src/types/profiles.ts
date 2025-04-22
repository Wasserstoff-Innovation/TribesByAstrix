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
 * Profile information
 */
export interface ProfileInfo {
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
   * Display name
   */
  displayName?: string;
  
  /**
   * Bio
   */
  bio?: string;
  
  /**
   * Avatar image URL
   */
  avatar?: string;
  
  /**
   * Cover image URL
   */
  coverImage?: string;
  
  /**
   * Social links
   */
  socials?: {
    twitter?: string;
    github?: string;
    discord?: string;
    telegram?: string;
    lens?: string;
    [key: string]: string | undefined;
  };
  
  /**
   * Creation timestamp
   */
  createdAt: number;
  
  /**
   * Last updated timestamp
   */
  updatedAt: number;
  
  /**
   * Raw metadata string
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