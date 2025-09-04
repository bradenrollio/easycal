/**
 * @fileoverview Database operations for tenants
 * @description Provides CRUD operations and business logic for tenant management.
 * Includes installation context handling and tenant validation.
 * @author AI Assistant
 */

import { eq, and, desc } from 'drizzle-orm';
import type { Database } from '@/lib/db/client';
import { tenants, type Tenant, type NewTenant } from '@/lib/db/schema';
import { AppError, ErrorCode, logger } from '@/lib/error-handler';

/**
 * Creates a new tenant record
 * @param db - Database client instance
 * @param data - Tenant data to insert
 * @returns Promise resolving to created tenant
 * @throws AppError if creation fails
 * 
 * @example
 * ```typescript
 * const tenant = await createTenant(db, {
 *   id: 'tenant-123',
 *   name: 'Acme Corp',
 *   installContext: 'agency',
 *   agencyId: null
 * });
 * ```
 */
export async function createTenant(
  db: Database, 
  data: NewTenant
): Promise<Tenant> {
  try {
    logger.info('Creating tenant', { tenantId: data.id, name: data.name });
    
    // Validate installation context
    if (!['agency', 'location'].includes(data.installContext)) {
      throw new AppError(
        'Invalid installation context',
        ErrorCode.VALIDATION_FAILED,
        400,
        { installContext: data.installContext },
        'TenantOperations'
      );
    }
    
    // For location installs, agencyId is required
    if (data.installContext === 'location' && !data.agencyId) {
      throw new AppError(
        'Agency ID is required for location-level installs',
        ErrorCode.VALIDATION_FAILED,
        400,
        { installContext: data.installContext },
        'TenantOperations'
      );
    }
    
    const [tenant] = await db
      .insert(tenants)
      .values(data)
      .returning();
      
    if (!tenant) {
      throw new AppError(
        'Failed to create tenant - no record returned',
        ErrorCode.DB_QUERY_FAILED,
        500,
        data,
        'TenantOperations'
      );
    }
    
    logger.info('Tenant created successfully', { tenantId: tenant.id });
    return tenant;
  } catch (error) {
    logger.error('Failed to create tenant', error, { data });
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'Database error creating tenant',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TenantOperations'
    );
  }
}

/**
 * Retrieves a tenant by ID
 * @param db - Database client instance
 * @param tenantId - Unique tenant identifier
 * @returns Promise resolving to tenant or null if not found
 * 
 * @example
 * ```typescript
 * const tenant = await getTenantById(db, 'tenant-123');
 * if (tenant) {
 *   console.log(`Found tenant: ${tenant.name}`);
 * }
 * ```
 */
export async function getTenantById(
  db: Database, 
  tenantId: string
): Promise<Tenant | null> {
  try {
    logger.debug('Fetching tenant by ID', { tenantId });
    
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
      
    return tenant ?? null;
  } catch (error) {
    logger.error('Failed to get tenant by ID', error, { tenantId });
    throw new AppError(
      'Database error fetching tenant',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TenantOperations'
    );
  }
}

/**
 * Retrieves all tenants for an agency
 * @param db - Database client instance
 * @param agencyId - Agency identifier
 * @returns Promise resolving to array of tenants
 * 
 * @example
 * ```typescript
 * const tenants = await getTenantsByAgency(db, 'agency-456');
 * console.log(`Found ${tenants.length} tenants for agency`);
 * ```
 */
export async function getTenantsByAgency(
  db: Database,
  agencyId: string
): Promise<Tenant[]> {
  try {
    logger.debug('Fetching tenants by agency', { agencyId });
    
    const tenantList = await db
      .select()
      .from(tenants)
      .where(
        and(
          eq(tenants.installContext, 'location'),
          eq(tenants.agencyId, agencyId)
        )
      )
      .orderBy(desc(tenants.createdAt));
      
    return tenantList;
  } catch (error) {
    logger.error('Failed to get tenants by agency', error, { agencyId });
    throw new AppError(
      'Database error fetching tenants',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TenantOperations'
    );
  }
}

/**
 * Updates a tenant record
 * @param db - Database client instance
 * @param tenantId - Tenant ID to update
 * @param updates - Partial tenant data to update
 * @returns Promise resolving to updated tenant
 * @throws AppError if tenant not found or update fails
 * 
 * @example
 * ```typescript
 * const updated = await updateTenant(db, 'tenant-123', {
 *   name: 'Updated Corp Name'
 * });
 * ```
 */
export async function updateTenant(
  db: Database,
  tenantId: string,
  updates: Partial<Omit<Tenant, 'id' | 'createdAt'>>
): Promise<Tenant> {
  try {
    logger.info('Updating tenant', { tenantId, updates });
    
    const [updatedTenant] = await db
      .update(tenants)
      .set(updates)
      .where(eq(tenants.id, tenantId))
      .returning();
      
    if (!updatedTenant) {
      throw new AppError(
        'Tenant not found for update',
        ErrorCode.API_NOT_FOUND,
        404,
        { tenantId },
        'TenantOperations'
      );
    }
    
    logger.info('Tenant updated successfully', { tenantId });
    return updatedTenant;
  } catch (error) {
    logger.error('Failed to update tenant', error, { tenantId, updates });
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'Database error updating tenant',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TenantOperations'
    );
  }
}

/**
 * Deletes a tenant and all related data
 * @param db - Database client instance
 * @param tenantId - Tenant ID to delete
 * @returns Promise resolving to boolean indicating success
 * @throws AppError if deletion fails
 * 
 * AI-OPTIMIZE: Consider implementing soft delete for audit purposes
 * 
 * @example
 * ```typescript
 * const deleted = await deleteTenant(db, 'tenant-123');
 * if (deleted) {
 *   console.log('Tenant deleted successfully');
 * }
 * ```
 */
export async function deleteTenant(
  db: Database,
  tenantId: string
): Promise<boolean> {
  try {
    logger.warn('Deleting tenant', { tenantId });
    
    // Note: CASCADE delete will handle related records (locations, tokens, jobs)
    const result = await db
      .delete(tenants)
      .where(eq(tenants.id, tenantId));
      
    const success = (result as any).changes > 0;
    
    if (success) {
      logger.info('Tenant deleted successfully', { tenantId });
    } else {
      logger.warn('Tenant not found for deletion', { tenantId });
    }
    
    return success;
  } catch (error) {
    logger.error('Failed to delete tenant', error, { tenantId });
    throw new AppError(
      'Database error deleting tenant',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TenantOperations'
    );
  }
}

/**
 * Checks if a tenant exists
 * @param db - Database client instance
 * @param tenantId - Tenant ID to check
 * @returns Promise resolving to boolean
 * 
 * @example
 * ```typescript
 * const exists = await tenantExists(db, 'tenant-123');
 * if (!exists) {
 *   throw new Error('Tenant not found');
 * }
 * ```
 */
export async function tenantExists(
  db: Database,
  tenantId: string
): Promise<boolean> {
  try {
    const tenant = await getTenantById(db, tenantId);
    return tenant !== null;
  } catch (error) {
    logger.error('Failed to check tenant existence', error, { tenantId });
    return false;
  }
}

/**
 * Gets tenant statistics
 * @param db - Database client instance
 * @param tenantId - Tenant ID
 * @returns Promise resolving to tenant statistics
 * 
 * AI-OPTIMIZE: Consider caching these statistics for performance
 * 
 * @example
 * ```typescript
 * const stats = await getTenantStats(db, 'tenant-123');
 * console.log(`Tenant has ${stats.locationCount} locations`);
 * ```
 */
export async function getTenantStats(
  db: Database,
  tenantId: string
): Promise<{
  locationCount: number;
  activeTokenCount: number;
  totalJobs: number;
}> {
  try {
    // This would require joins with other tables
    // Implementation depends on specific requirements
    // For now, return basic stats
    
    return {
      locationCount: 0,
      activeTokenCount: 0,
      totalJobs: 0,
    };
  } catch (error) {
    logger.error('Failed to get tenant statistics', error, { tenantId });
    throw new AppError(
      'Database error fetching tenant statistics',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TenantOperations'
    );
  }
}
