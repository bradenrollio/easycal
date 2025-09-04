/**
 * @fileoverview Unified API exports
 * @description Central export point for all API-related functionality.
 * Provides clean imports and better tree-shaking.
 * @author AI Assistant
 */

// GoHighLevel API exports
export * from './ghl/client';
export * from './ghl/context';

// API type definitions
export * from './types';

// Re-export commonly used API utilities
export { AppError, ErrorCode, logger } from '../error-handler';

/**
 * API configuration and constants
 */
export const API_CONFIG = {
  GHL_BASE_URL: 'https://services.leadconnectorhq.com',
  GHL_API_VERSION: '2021-07-28',
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
} as const;

/**
 * Common API response wrapper
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * API client factory function
 * @param accessToken - OAuth access token
 * @param locationId - GoHighLevel location ID
 * @returns Configured API client
 */
export function createAPIClient(accessToken: string, locationId: string) {
  // This will be implemented when we move the GHL client
  return {
    accessToken,
    locationId,
    // Add other client methods here
  };
}
