/**
 * @fileoverview Database operations for OAuth tokens
 * @description Provides secure token management with encryption/decryption,
 * expiration handling, and automatic refresh capabilities.
 * @author AI Assistant
 */

import { eq, and, lt, desc } from 'drizzle-orm';
import type { Database } from '@/lib/db/client';
import { tokens, type Token, type NewToken } from '@/lib/db/schema';
import { AppError, ErrorCode, logger } from '@/lib/error-handler';

/**
 * Token encryption utilities
 * AI-OPTIMIZE: Consider using a dedicated encryption service
 */
class TokenEncryption {
  private static async getKey(encryptionKey: string): Promise<CryptoKey> {
    const keyBuffer = new TextEncoder().encode(encryptionKey.substring(0, 32));
    return crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts a token string
   * @param token - Plain text token
   * @param encryptionKey - Encryption key
   * @returns Promise resolving to encrypted token with IV
   */
  static async encrypt(token: string, encryptionKey: string): Promise<string> {
    try {
      const key = await this.getKey(encryptionKey);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(token);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      );
      
      const encryptedArray = new Uint8Array(encrypted);
      const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
      const ivBase64 = btoa(String.fromCharCode(...iv));
      
      return `${encryptedBase64}:${ivBase64}`;
    } catch (error) {
      logger.error('Token encryption failed', error);
      throw new AppError(
        'Failed to encrypt token',
        ErrorCode.INTERNAL_ERROR,
        500,
        error instanceof Error ? error.message : 'Unknown error',
        'TokenEncryption'
      );
    }
  }

  /**
   * Decrypts an encrypted token
   * @param encryptedToken - Encrypted token with IV
   * @param encryptionKey - Encryption key
   * @returns Promise resolving to decrypted token
   */
  static async decrypt(encryptedToken: string, encryptionKey: string): Promise<string> {
    try {
      const [encryptedData, ivData] = encryptedToken.split(':');
      if (!encryptedData || !ivData) {
        throw new Error('Invalid encrypted token format');
      }
      
      const key = await this.getKey(encryptionKey);
      const encrypted = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
      const iv = new Uint8Array(atob(ivData).split('').map(char => char.charCodeAt(0)));
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logger.error('Token decryption failed', error);
      throw new AppError(
        'Failed to decrypt token',
        ErrorCode.INTERNAL_ERROR,
        500,
        error instanceof Error ? error.message : 'Unknown error',
        'TokenEncryption'
      );
    }
  }
}

/**
 * Stores encrypted OAuth tokens
 * @param db - Database client instance
 * @param data - Token data to store
 * @param encryptionKey - Encryption key for token storage
 * @returns Promise resolving to stored token record
 * 
 * @example
 * ```typescript
 * const tokenRecord = await storeTokens(db, {
 *   id: 'token-123',
 *   tenantId: 'tenant-123',
 *   locationId: 'location-123',
 *   accessToken: 'raw-access-token',
 *   refreshToken: 'raw-refresh-token',
 *   scope: 'calendars.read calendars.write',
 *   expiresAt: new Date(Date.now() + 3600000)
 * }, encryptionKey);
 * ```
 */
export async function storeTokens(
  db: Database,
  data: Omit<NewToken, 'accessToken' | 'refreshToken'> & {
    accessToken: string;
    refreshToken: string;
  },
  encryptionKey: string
): Promise<Token> {
  try {
    logger.info('Storing encrypted tokens', { 
      tenantId: data.tenantId, 
      locationId: data.locationId 
    });
    
    // Encrypt tokens before storage
    const encryptedAccessToken = await TokenEncryption.encrypt(data.accessToken, encryptionKey);
    const encryptedRefreshToken = await TokenEncryption.encrypt(data.refreshToken, encryptionKey);
    
    const tokenData: NewToken = {
      ...data,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
    };
    
    const [token] = await db
      .insert(tokens)
      .values(tokenData)
      .returning();
      
    if (!token) {
      throw new AppError(
        'Failed to store tokens - no record returned',
        ErrorCode.DB_QUERY_FAILED,
        500,
        { tenantId: data.tenantId, locationId: data.locationId },
        'TokenOperations'
      );
    }
    
    logger.info('Tokens stored successfully', { tokenId: token.id });
    return token;
  } catch (error) {
    logger.error('Failed to store tokens', error, { 
      tenantId: data.tenantId, 
      locationId: data.locationId 
    });
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'Database error storing tokens',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TokenOperations'
    );
  }
}

/**
 * Retrieves and decrypts tokens for a location
 * @param db - Database client instance
 * @param tenantId - Tenant identifier
 * @param locationId - Location identifier (optional for agency-level tokens)
 * @param encryptionKey - Encryption key for token decryption
 * @returns Promise resolving to decrypted token data or null
 * 
 * @example
 * ```typescript
 * const tokenData = await getLocationTokens(db, 'tenant-123', 'location-123', encryptionKey);
 * if (tokenData && !isTokenExpired(tokenData.token)) {
 *   // Use access token for API calls
 *   const calendars = await ghlClient.listCalendars(tokenData.accessToken);
 * }
 * ```
 */
export async function getLocationTokens(
  db: Database,
  tenantId: string,
  locationId?: string,
  encryptionKey?: string
): Promise<{
  token: Token;
  accessToken: string;
  refreshToken: string;
} | null> {
  try {
    logger.debug('Fetching location tokens', { tenantId, locationId });
    
    // First try location-specific token, then fall back to agency token
    const [token] = await db
      .select()
      .from(tokens)
      .where(
        locationId 
          ? and(eq(tokens.tenantId, tenantId), eq(tokens.locationId, locationId))
          : and(eq(tokens.tenantId, tenantId), eq(tokens.locationId, null as any))
      )
      .orderBy(desc(tokens.expiresAt))
      .limit(1);
      
    if (!token) {
      // If no location-specific token and locationId provided, try agency token
      if (locationId) {
        return getLocationTokens(db, tenantId, undefined, encryptionKey);
      }
      return null;
    }
    
    // Return encrypted tokens if no encryption key provided
    if (!encryptionKey) {
      return {
        token,
        accessToken: token.accessToken, // Still encrypted
        refreshToken: token.refreshToken, // Still encrypted
      };
    }
    
    // Decrypt tokens
    const accessToken = await TokenEncryption.decrypt(token.accessToken, encryptionKey);
    const refreshToken = await TokenEncryption.decrypt(token.refreshToken, encryptionKey);
    
    return {
      token,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('Failed to get location tokens', error, { tenantId, locationId });
    throw new AppError(
      'Database error fetching tokens',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TokenOperations'
    );
  }
}

/**
 * Updates existing token with new values
 * @param db - Database client instance
 * @param tokenId - Token record ID to update
 * @param updates - New token values
 * @param encryptionKey - Encryption key for token encryption
 * @returns Promise resolving to updated token record
 * 
 * @example
 * ```typescript
 * const updated = await updateTokens(db, 'token-123', {
 *   accessToken: 'new-access-token',
 *   refreshToken: 'new-refresh-token',
 *   expiresAt: new Date(Date.now() + 3600000)
 * }, encryptionKey);
 * ```
 */
export async function updateTokens(
  db: Database,
  tokenId: string,
  updates: Partial<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    scope: string;
  }>,
  encryptionKey: string
): Promise<Token> {
  try {
    logger.info('Updating tokens', { tokenId });
    
    const updateData: Partial<Token> = {};
    
    // Encrypt tokens if provided
    if (updates.accessToken) {
      updateData.accessToken = await TokenEncryption.encrypt(updates.accessToken, encryptionKey);
    }
    if (updates.refreshToken) {
      updateData.refreshToken = await TokenEncryption.encrypt(updates.refreshToken, encryptionKey);
    }
    if (updates.expiresAt) {
      updateData.expiresAt = updates.expiresAt;
    }
    if (updates.scope) {
      updateData.scope = updates.scope;
    }
    
    const [updatedToken] = await db
      .update(tokens)
      .set(updateData)
      .where(eq(tokens.id, tokenId))
      .returning();
      
    if (!updatedToken) {
      throw new AppError(
        'Token not found for update',
        ErrorCode.API_NOT_FOUND,
        404,
        { tokenId },
        'TokenOperations'
      );
    }
    
    logger.info('Tokens updated successfully', { tokenId });
    return updatedToken;
  } catch (error) {
    logger.error('Failed to update tokens', error, { tokenId, updates });
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'Database error updating tokens',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TokenOperations'
    );
  }
}

/**
 * Deletes expired tokens from the database
 * @param db - Database client instance
 * @returns Promise resolving to number of deleted tokens
 * 
 * AI-OPTIMIZE: Run this as a scheduled job for automatic cleanup
 * 
 * @example
 * ```typescript
 * const deletedCount = await cleanupExpiredTokens(db);
 * console.log(`Cleaned up ${deletedCount} expired tokens`);
 * ```
 */
export async function cleanupExpiredTokens(db: Database): Promise<number> {
  try {
    logger.info('Cleaning up expired tokens');
    
    const now = new Date();
    const result = await db
      .delete(tokens)
      .where(lt(tokens.expiresAt, now));
      
    const deletedCount = (result as any).changes || 0;
    logger.info(`Cleaned up ${deletedCount} expired tokens`);
    
    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', error);
    throw new AppError(
      'Database error cleaning up tokens',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TokenOperations'
    );
  }
}

/**
 * Checks if a token is expired
 * @param token - Token record to check
 * @returns Boolean indicating if token is expired
 * 
 * @example
 * ```typescript
 * if (isTokenExpired(token)) {
 *   // Refresh the token
 *   await refreshTokens(db, token.id, encryptionKey);
 * }
 * ```
 */
export function isTokenExpired(token: Token): boolean {
  const now = new Date();
  const expiresAt = new Date(token.expiresAt);
  
  // Consider token expired if it expires within the next 5 minutes
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return expiresAt.getTime() - now.getTime() < bufferTime;
}

/**
 * Deletes tokens for a specific tenant/location
 * @param db - Database client instance
 * @param tenantId - Tenant identifier
 * @param locationId - Location identifier (optional)
 * @returns Promise resolving to number of deleted tokens
 * 
 * @example
 * ```typescript
 * // Delete all tokens for a location
 * await deleteTokens(db, 'tenant-123', 'location-123');
 * 
 * // Delete all agency tokens for a tenant
 * await deleteTokens(db, 'tenant-123');
 * ```
 */
export async function deleteTokens(
  db: Database,
  tenantId: string,
  locationId?: string
): Promise<number> {
  try {
    logger.warn('Deleting tokens', { tenantId, locationId });
    
    const result = await db
      .delete(tokens)
      .where(
        locationId 
          ? and(eq(tokens.tenantId, tenantId), eq(tokens.locationId, locationId))
          : and(eq(tokens.tenantId, tenantId), eq(tokens.locationId, null as any))
      );
      
    const deletedCount = (result as any).changes || 0;
    logger.info(`Deleted ${deletedCount} tokens`, { tenantId, locationId });
    
    return deletedCount;
  } catch (error) {
    logger.error('Failed to delete tokens', error, { tenantId, locationId });
    throw new AppError(
      'Database error deleting tokens',
      ErrorCode.DB_QUERY_FAILED,
      500,
      error instanceof Error ? error.message : 'Unknown error',
      'TokenOperations'
    );
  }
}
