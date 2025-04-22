/**
 * Organization types for Tribes by Astrix SDK
 */

/**
 * Organization information
 */
export interface OrganizationInfo {
  id: string;
  name: string;
  admin: string;
  metadata: string;
  tribes: number[];
  members: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Parameters for creating an organization
 */
export interface CreateOrganizationParams {
  name: string;
  admin?: string; // Defaults to connected wallet
  metadata?: string;
}

/**
 * Parameters for updating an organization
 */
export interface UpdateOrganizationParams {
  id: string;
  name?: string;
  admin?: string;
  metadata?: string;
}

/**
 * Parameters for adding a tribe to an organization
 */
export interface AddTribeToOrganizationParams {
  organizationId: string;
  tribeId: number;
}

/**
 * Parameters for removing a tribe from an organization
 */
export interface RemoveTribeFromOrganizationParams {
  organizationId: string;
  tribeId: number;
}

/**
 * Parameters for adding a member to an organization
 */
export interface AddMemberToOrganizationParams {
  organizationId: string;
  member: string;
}

/**
 * Parameters for removing a member from an organization
 */
export interface RemoveMemberFromOrganizationParams {
  organizationId: string;
  member: string;
}

/**
 * Organization member information
 */
export interface OrganizationMemberInfo {
  address: string;
  joinedAt: number;
  roles: string[];
}

/**
 * Options for fetching organizations
 */
export interface GetOrganizationsOptions {
  admin?: string;
  member?: string;
  tribe?: number;
  limit?: number;
  offset?: number;
}

/**
 * Organization event types
 */
export enum OrganizationEventType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  TRIBE_ADDED = 'TRIBE_ADDED',
  TRIBE_REMOVED = 'TRIBE_REMOVED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED'
} 