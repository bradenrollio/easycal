/**
 * @fileoverview Unified database exports
 * @description Central export point for all database-related functionality.
 * Provides clean imports and better organization.
 * @author AI Assistant
 */

// Core database functionality
export * from './client';
export * from './schema';

// Database operations
export * from './operations/tenants';
export * from './operations/tokens';

// Encryption utilities
export * from './encryption';

/**
 * Database configuration and constants
 */
export const DB_CONFIG = {
  MAX_CONNECTIONS: 10,
  QUERY_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

/**
 * Common database types
 */
export type DatabaseTransaction = Parameters<Parameters<ReturnType<typeof import('./client').createDbClient>['transaction']>[0]>[0];

/**
 * Database health check
 * @param db - Database client
 * @returns Promise resolving to health status
 */
export async function checkDatabaseHealth(db: ReturnType<typeof import('./client').createDbClient>): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    // Simple query to check database connectivity
    const { tenants } = await import('./schema');
    await db.select().from(tenants).limit(1);
    
    return {
      healthy: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
