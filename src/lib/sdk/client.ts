import HighLevel from '@gohighlevel/api-client';
import Bottleneck from 'bottleneck';

export interface SDKClientOptions {
  clientId?: string;
  clientSecret?: string;
  privateIntegrationToken?: string;
  locationId?: string;
  accessToken?: string;
  refreshToken?: string;
  onTokenRefresh?: (newTokens: { accessToken: string; refreshToken: string; expiresAt: Date }) => Promise<void>;
}

/**
 * Rate limiter configuration for GoHighLevel API
 */
const rateLimiter = new Bottleneck({
  maxConcurrent: 3, // Max 3 concurrent requests
  minTime: 250, // Min 250ms between requests
  reservoir: 100, // 100 requests per reservoir
  reservoirRefreshInterval: 60 * 1000, // Refresh every minute
  reservoirRefreshAmount: 100,
});

/**
 * Error types for better error handling
 */
export class SDKError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'SDKError';
  }
}

export class AuthenticationError extends SDKError {
  constructor(message: string) {
    super(message, 401, false);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends SDKError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 429, true);
    this.name = 'RateLimitError';
  }
}

/**
 * Enhanced SDK client with retry logic and token management
 */
export class GoHighLevelClient {
  private client: any;
  private options: SDKClientOptions;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiry?: Date;

  constructor(options: SDKClientOptions) {
    this.options = options;
    this.initializeClient();
  }

  private initializeClient() {
    this.client = new HighLevel({
      clientId: this.options.clientId || process.env.HL_CLIENT_ID,
      clientSecret: this.options.clientSecret || process.env.HL_CLIENT_SECRET,
      privateIntegrationToken: this.options.privateIntegrationToken || process.env.HL_PIT,
    });

    if (this.options.accessToken) {
      this.client.setAccessToken(this.options.accessToken);
    }

    if (this.options.locationId) {
      this.client.setLocationId(this.options.locationId);
    }

    this.accessToken = this.options.accessToken;
    this.refreshToken = this.options.refreshToken;
  }

  /**
   * Execute a request with automatic retry and rate limiting
   */
  private async executeRequest<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if token needs refresh before making request
        await this.ensureValidToken();

        // Execute with rate limiting
        return await rateLimiter.schedule(operation);
      } catch (error: any) {
        lastError = error;

        // Handle different error types
        if (error.statusCode === 401 && this.refreshToken) {
          // Token expired, try to refresh
          try {
            await this.refreshAccessToken();
            continue; // Retry with new token
          } catch (refreshError) {
            throw new AuthenticationError('Token refresh failed: ' + refreshError.message);
          }
        }

        if (error.statusCode === 429) {
          // Rate limited
          const retryAfter = error.headers?.['retry-after'] || 60;
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            continue;
          }
          throw new RateLimitError('Rate limit exceeded', retryAfter);
        }

        // For server errors (5xx), retry with exponential backoff
        if (error.statusCode >= 500 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // For other errors or if max retries reached
        throw new SDKError(
          error.message || 'API request failed',
          error.statusCode,
          error.statusCode >= 500
        );
      }
    }

    throw lastError!;
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry) {
      return; // No token to validate
    }

    // Refresh if token expires within 5 minutes
    const refreshThreshold = new Date(Date.now() + 5 * 60 * 1000);

    if (this.tokenExpiry <= refreshThreshold) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Refresh the access token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new AuthenticationError('No refresh token available');
    }

    try {
      const response = await this.client.oauth.refreshToken({
        refreshToken: this.refreshToken,
      });

      this.accessToken = response.access_token;
      this.refreshToken = response.refresh_token;
      this.tokenExpiry = new Date(Date.now() + response.expires_in * 1000);

      // Notify callback if provided
      if (this.options.onTokenRefresh) {
        await this.options.onTokenRefresh({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          expiresAt: this.tokenExpiry,
        });
      }

      // Update client with new token
      this.client.setAccessToken(this.accessToken);
    } catch (error: any) {
      throw new AuthenticationError('Failed to refresh token: ' + error.message);
    }
  }

  /**
   * Get current access token info
   */
  getTokenInfo() {
    return {
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      expiresAt: this.tokenExpiry,
    };
  }

  // Calendar API methods

  /**
   * List calendars for a location
   */
  async listCalendars(params?: { limit?: number; offset?: number }) {
    return this.executeRequest(() =>
      this.client.calendars.list({
        locationId: this.options.locationId,
        ...params,
      })
    );
  }

  /**
   * Create a new calendar
   */
  async createCalendar(calendarData: {
    name: string;
    slug: string;
    groupId?: string;
    availabilityTimezone: string;
    slotDurationMinutes: number;
    minNoticeMinutes: number;
    bookingWindowDays: number;
    isActive: boolean;
  }) {
    return this.executeRequest(() =>
      this.client.calendars.create({
        locationId: this.options.locationId,
        ...calendarData,
      })
    );
  }

  /**
   * Delete a calendar
   */
  async deleteCalendar(calendarId: string) {
    return this.executeRequest(() =>
      this.client.calendars.delete(calendarId, {
        locationId: this.options.locationId,
      })
    );
  }

  /**
   * Get calendar details
   */
  async getCalendar(calendarId: string) {
    return this.executeRequest(() =>
      this.client.calendars.get(calendarId, {
        locationId: this.options.locationId,
      })
    );
  }

  // OAuth methods

  /**
   * Generate OAuth authorization URL
   */
  getAuthorizationUrl(scopes: string[], state?: string): string {
    const baseUrl = 'https://services.leadconnectorhq.com/oauth/clients/68b96169e165955a7edc20b3/authentication/oauth2/authorize';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.options.clientId || process.env.HL_CLIENT_ID!,
      redirect_uri: `${process.env.APP_BASE_URL}/auth/callback`,
      scope: scopes.join(' '),
      ...(state && { state }),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string) {
    return this.executeRequest(() =>
      this.client.oauth.token({
        code,
        redirect_uri: `${process.env.APP_BASE_URL}/auth/callback`,
      })
    );
  }

  /**
   * List locations for an agency
   */
  async listLocations() {
    return this.executeRequest(() =>
      this.client.locations.list()
    );
  }

  /**
   * Generate location-specific tokens
   */
  async generateLocationToken(locationId: string, scopes: string[]) {
    return this.executeRequest(() =>
      this.client.oauth.generateLocationToken({
        locationId,
        scopes,
      })
    );
  }
}

/**
 * Factory function to create SDK client
 */
export function createSDKClient(options: SDKClientOptions): GoHighLevelClient {
  return new GoHighLevelClient(options);
}
