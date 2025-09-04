/**
 * @fileoverview Application constants
 * @description Central location for all application constants and configuration.
 * @author AI Assistant
 */

// Branding constants
export * from './branding';

/**
 * Application configuration constants
 */
export const APP_CONFIG = {
  NAME: 'EasyCal',
  VERSION: '1.0.0',
  DESCRIPTION: 'Brand-Aware Bulk Calendar Manager for GoHighLevel',
  SUPPORT_EMAIL: 'support@easycal.app',
} as const;

/**
 * API configuration constants
 */
export const API_CONSTANTS = {
  GHL_BASE_URL: 'https://services.leadconnectorhq.com',
  GHL_API_VERSION: '2021-07-28',
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 100,
    CONCURRENT_REQUESTS: 3,
    MIN_REQUEST_INTERVAL: 250, // ms
  },
} as const;

/**
 * Database constants
 */
export const DB_CONSTANTS = {
  MAX_CONNECTIONS: 10,
  QUERY_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
} as const;

/**
 * Validation constants
 */
export const VALIDATION_CONSTANTS = {
  CALENDAR_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
  BUTTON_TEXT: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
  },
  DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  SLUG: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-z0-9-]+$/,
  },
  TIME_FORMAT: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  HEX_COLOR: /^#[0-9a-fA-F]{6}$/,
} as const;

/**
 * Job processing constants
 */
export const JOB_CONSTANTS = {
  TYPES: {
    CREATE_CALENDARS: 'create_calendars',
    DELETE_CALENDARS: 'delete_calendars',
    REFRESH_TOKENS: 'refresh_tokens',
  },
  STATUSES: {
    QUEUED: 'queued',
    RUNNING: 'running',
    SUCCESS: 'success',
    ERROR: 'error',
    CANCELLED: 'cancelled',
  },
  TIMEOUTS: {
    DEFAULT: 5 * 60 * 1000, // 5 minutes
    LONG_RUNNING: 30 * 60 * 1000, // 30 minutes
  },
} as const;

/**
 * UI constants
 */
export const UI_CONSTANTS = {
  TOAST_DURATION: 5000,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 300,
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
} as const;

/**
 * Error codes used throughout the application
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // API errors
  API_ERROR: 'API_ERROR',
  API_RATE_LIMITED: 'API_RATE_LIMITED',
  API_NOT_FOUND: 'API_NOT_FOUND',
  API_FORBIDDEN: 'API_FORBIDDEN',
  
  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
  
  // Business logic errors
  CALENDAR_EXISTS: 'CALENDAR_EXISTS',
  LOCATION_NOT_FOUND: 'LOCATION_NOT_FOUND',
  JOB_FAILED: 'JOB_FAILED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;
