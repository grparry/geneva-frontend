/**
 * Tenant-related constants for Geneva multi-tenant frontend
 */

/**
 * Superadmin customer ID - the only customer that can access customer switching
 * This ID is returned by /api/tenant-config?subdomain=localhost in development
 */
export const SUPERADMIN_CUSTOMER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * API endpoints for tenant operations
 */
export const TENANT_API_ENDPOINTS = {
  TENANT_CONFIG: '/api/tenant-config',
  CUSTOMERS: '/api/customers/'
} as const;