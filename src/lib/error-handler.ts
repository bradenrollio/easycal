/**
 * @fileoverview Centralized error handling and logging utilities
 * @description Provides structured error handling, logging, and error types
 * for consistent error management across the EasyCal application.
 * @author AI Assistant
 */

/**
 * Standard error codes used throughout the application
 */
export enum ErrorCode {
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  
  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // API errors
  API_ERROR = 'API_ERROR',
  API_RATE_LIMITED = 'API_RATE_LIMITED',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_FORBIDDEN = 'API_FORBIDDEN',
  
  // Database errors
  DB_CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED = 'DB_QUERY_FAILED',
  DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  
  // Business logic errors
  CALENDAR_EXISTS = 'CALENDAR_EXISTS',
  LOCATION_NOT_FOUND = 'LOCATION_NOT_FOUND',
  JOB_FAILED = 'JOB_FAILED',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
}

/**
 * Structured error class for consistent error handling
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly timestamp: Date;
  public readonly context?: string;

  /**
   * Creates a new application error
   * @param message - Human-readable error message
   * @param code - Application error code
   * @param statusCode - HTTP status code (default: 500)
   * @param details - Additional error details
   * @param context - Context where error occurred
   */
  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    details?: unknown,
    context?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.context = context;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Converts error to JSON for API responses
   * @returns Serializable error object
   */
  toJSON(): Record<string, unknown> {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp.toISOString(),
        context: this.context,
        ...(this.details ? { details: this.details } : {})
      }
    };
  }
}

/**
 * Logger interface for structured logging
 */
export interface Logger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, error?: unknown, data?: unknown): void;
  debug(message: string, data?: unknown): void;
}

/**
 * Console-based logger implementation
 * AI-OPTIMIZE: Replace with proper logging service in production
 */
export class ConsoleLogger implements Logger {
  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const baseLog = `[${timestamp}] [${level}] ${message}`;
    
    if (data) {
      return `${baseLog} ${JSON.stringify(data, null, 2)}`;
    }
    
    return baseLog;
  }

  info(message: string, data?: unknown): void {
    console.log(this.formatMessage('INFO', message, data));
  }

  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage('WARN', message, data));
  }

  error(message: string, error?: unknown, data?: unknown): void {
    const errorData = {
      ...(data || {}),
      ...(error instanceof Error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    };
    console.error(this.formatMessage('ERROR', message, errorData));
  }

  debug(message: string, data?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new ConsoleLogger();

/**
 * Error handler for API routes
 * @param error - Error to handle
 * @param context - Context where error occurred
 * @returns Standardized error response
 */
export function handleAPIError(error: unknown, context: string): Response {
  if (error instanceof AppError) {
    logger.error(`API Error in ${context}:`, error);
    return new Response(JSON.stringify(error.toJSON()), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle unknown errors
  const appError = new AppError(
    'Internal server error',
    ErrorCode.INTERNAL_ERROR,
    500,
    error instanceof Error ? error.message : 'Unknown error',
    context
  );

  logger.error(`Unexpected error in ${context}:`, error);
  return new Response(JSON.stringify(appError.toJSON()), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Creates authentication error
 * @param message - Error message
 * @param details - Additional details
 * @returns AppError instance
 */
export function createAuthError(message: string, details?: unknown): AppError {
  return new AppError(message, ErrorCode.AUTH_REQUIRED, 401, details, 'Authentication');
}

/**
 * Creates validation error
 * @param message - Error message
 * @param details - Validation details
 * @returns AppError instance
 */
export function createValidationError(message: string, details?: unknown): AppError {
  return new AppError(message, ErrorCode.VALIDATION_FAILED, 400, details, 'Validation');
}

/**
 * Creates API error from HTTP response
 * @param response - HTTP response object
 * @param context - Context where error occurred
 * @returns AppError instance
 */
export async function createAPIError(response: Response, context: string): Promise<AppError> {
  let details: unknown;
  try {
    details = await response.text();
  } catch {
    details = 'Unable to read error response';
  }

  const statusCodeMap: Record<number, ErrorCode> = {
    400: ErrorCode.INVALID_INPUT,
    401: ErrorCode.AUTH_INVALID,
    403: ErrorCode.API_FORBIDDEN,
    404: ErrorCode.API_NOT_FOUND,
    429: ErrorCode.API_RATE_LIMITED,
    500: ErrorCode.API_ERROR,
  };

  const code = statusCodeMap[response.status] || ErrorCode.API_ERROR;
  const message = `API request failed: ${response.status} ${response.statusText}`;

  return new AppError(message, code, response.status, details, context);
}

/**
 * Wraps async functions with error handling
 * @param fn - Async function to wrap
 * @param context - Context for error reporting
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error(`Error in ${context}:`, error);
      throw error instanceof AppError ? error : new AppError(
        'Operation failed',
        ErrorCode.INTERNAL_ERROR,
        500,
        error instanceof Error ? error.message : 'Unknown error',
        context
      );
    }
  };
}

/**
 * Type guard to check if error is AppError
 * @param error - Error to check
 * @returns True if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Extracts error message from unknown error
 * @param error - Error to extract message from
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error occurred';
}
