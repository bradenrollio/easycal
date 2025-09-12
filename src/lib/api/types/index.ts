/**
 * @fileoverview API type definitions
 * @description Centralized type definitions for all API interactions.
 * Includes CRM API types, request/response interfaces, and error types.
 * @author AI Assistant
 */

/**
 * Standard API response wrapper used throughout the application
 */
export interface APIResponse<T = unknown> {
  /** Whether the API request was successful */
  success: boolean;
  /** Response data (present on success) */
  data?: T;
  /** Error information (present on failure) */
  error?: APIError;
}

/**
 * Standardized API error structure
 */
export interface APIError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: unknown;
  /** HTTP status code */
  statusCode?: number;
}

/**
 * CRM API response types
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace GHL {
  /**
   * Calendar object from GHL API
   */
  export interface Calendar {
    id: string;
    name: string;
    slug: string;
    groupId?: string;
    isActive: boolean;
    locationId: string;
    customizations?: {
      primaryColor?: string;
      backgroundColor?: string;
      buttonText?: string;
    };
    createdAt?: string;
    updatedAt?: string;
  }

  /**
   * Calendar group object from GHL API
   */
  export interface CalendarGroup {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    locationId: string;
  }

  /**
   * Location object from GHL API
   */
  export interface Location {
    id: string;
    name: string;
    timezone: string;
    companyId?: string;
  }

  /**
   * OAuth token response from GHL API
   */
  export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  }

  /**
   * API error response from GHL
   */
  export interface ErrorResponse {
    error: string;
    error_description?: string;
    message?: string;
  }
}

/**
 * Request/Response types for common operations
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace API {
  /**
   * Calendar creation request
   */
  export interface CreateCalendarRequest {
    name: string;
    description?: string;
    slug?: string;
    groupId?: string;
    customizations?: {
      primaryColor: string;
      backgroundColor: string;
      buttonText: string;
    };
    availability: {
      weekly: Array<{
        day: string;
        start: string;
        end: string;
      }>;
      slotInterval: number;
    };
    minSchedulingNotice: number;
    maxBookingsPerDay: number;
    timeZone: string;
  }

  /**
   * Bulk calendar creation request
   */
  export interface BulkCreateCalendarsRequest {
    calendars: CreateCalendarRequest[];
    locationId: string;
    brandConfig?: {
      primaryColorHex: string;
      backgroundColorHex: string;
      defaultButtonText: string;
    };
  }

  /**
   * Job status response
   */
  export interface JobStatusResponse {
    id: string;
    status: 'queued' | 'running' | 'success' | 'error';
    progress: {
      total: number;
      completed: number;
      failed: number;
    };
    results?: Array<{
      id: string;
      name: string;
      success: boolean;
      error?: string;
    }>;
  }
}

/**
 * Pagination types
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Common request options
 */
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}
