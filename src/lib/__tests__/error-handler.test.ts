/**
 * @fileoverview Tests for error handling utilities
 * @author AI Assistant
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AppError,
  ErrorCode,
  ConsoleLogger,
  handleAPIError,
  createAuthError,
  createValidationError,
  createAPIError,
  withErrorHandling,
  isAppError,
  getErrorMessage,
} from '../error-handler';

describe('error-handler', () => {
  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError(
        'Test error',
        ErrorCode.VALIDATION_FAILED,
        400,
        { field: 'test' },
        'TestContext'
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.context).toBe('TestContext');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should use default status code', () => {
      const error = new AppError('Test error', ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError(
        'Test error',
        ErrorCode.VALIDATION_FAILED,
        400,
        { field: 'test' },
        'TestContext'
      );

      const json = error.toJSON();
      expect(json).toEqual({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_FAILED,
          message: 'Test error',
          statusCode: 400,
          timestamp: error.timestamp.toISOString(),
          context: 'TestContext',
          details: { field: 'test' },
        },
      });
    });
  });

  describe('ConsoleLogger', () => {
    let consoleSpy: any;
    let logger: ConsoleLogger;

    beforeEach(() => {
      logger = new ConsoleLogger();
      consoleSpy = {
        log: vi.spyOn(console, 'log').mockImplementation(() => {}),
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
        debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      };
    });

    afterEach(() => {
      Object.values(consoleSpy).forEach((spy: any) => spy.mockRestore());
    });

    it('should log info messages', () => {
      logger.info('Test message', { data: 'test' });
      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test message')
      );
    });

    it('should log warnings', () => {
      logger.warn('Warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message')
      );
    });

    it('should log errors with error details', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error, { context: 'test' });
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error occurred')
      );
    });

    it('should log debug only in development', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test development
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true });
      logger.debug('Debug message');
      expect(consoleSpy.debug).toHaveBeenCalled();
      
      // Test production
      consoleSpy.debug.mockClear();
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true });
      logger.debug('Debug message');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, writable: true });
    });
  });

  describe('handleAPIError', () => {
    it('should handle AppError correctly', () => {
      const appError = new AppError('Test error', ErrorCode.VALIDATION_FAILED, 400);
      const response = handleAPIError(appError, 'TestAPI');
      
      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Unknown error');
      const response = handleAPIError(unknownError, 'TestAPI');
      
      expect(response.status).toBe(500);
    });

    it('should handle non-Error objects', () => {
      const response = handleAPIError('String error', 'TestAPI');
      expect(response.status).toBe(500);
    });
  });

  describe('createAuthError', () => {
    it('should create authentication error', () => {
      const error = createAuthError('Auth required', { userId: '123' });
      
      expect(error.code).toBe(ErrorCode.AUTH_REQUIRED);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Auth required');
      expect(error.details).toEqual({ userId: '123' });
      expect(error.context).toBe('Authentication');
    });
  });

  describe('createValidationError', () => {
    it('should create validation error', () => {
      const error = createValidationError('Invalid input', { field: 'email' });
      
      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual({ field: 'email' });
      expect(error.context).toBe('Validation');
    });
  });

  describe('createAPIError', () => {
    it('should create API error from response', async () => {
      const response = new Response('Not found', { status: 404, statusText: 'Not Found' });
      const error = await createAPIError(response, 'TestAPI');
      
      expect(error.code).toBe(ErrorCode.API_NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('404 Not Found');
      expect(error.context).toBe('TestAPI');
    });

    it('should handle unknown status codes', async () => {
      const response = new Response('Server error', { status: 502 });
      const error = await createAPIError(response, 'TestAPI');
      
      expect(error.code).toBe(ErrorCode.API_ERROR);
      expect(error.statusCode).toBe(502);
    });

    it('should handle unreadable response', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockRejectedValue(new Error('Cannot read')),
      } as unknown as Response;
      
      const error = await createAPIError(mockResponse, 'TestAPI');
      expect(error.details).toBe('Unable to read error response');
    });
  });

  describe('withErrorHandling', () => {
    it('should wrap function and return result on success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const wrapped = withErrorHandling(fn, 'TestContext');
      
      const result = await wrapped('arg1', 'arg2');
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should re-throw AppError', async () => {
      const appError = new AppError('Test error', ErrorCode.VALIDATION_FAILED);
      const fn = vi.fn().mockRejectedValue(appError);
      const wrapped = withErrorHandling(fn, 'TestContext');
      
      await expect(wrapped()).rejects.toThrow(appError);
    });

    it('should wrap unknown errors in AppError', async () => {
      const originalError = new Error('Original error');
      const fn = vi.fn().mockRejectedValue(originalError);
      const wrapped = withErrorHandling(fn, 'TestContext');
      
      await expect(wrapped()).rejects.toThrow(AppError);
      
      try {
        await wrapped();
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect((error as AppError).context).toBe('TestContext');
        expect((error as AppError).details).toBe('Original error');
      }
    });
  });

  describe('isAppError', () => {
    it('should identify AppError instances', () => {
      const appError = new AppError('Test', ErrorCode.INTERNAL_ERROR);
      const regularError = new Error('Regular error');
      const notError = 'string';
      
      expect(isAppError(appError)).toBe(true);
      expect(isAppError(regularError)).toBe(false);
      expect(isAppError(notError)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error objects', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('String error')).toBe('String error');
    });

    it('should handle unknown error types', () => {
      expect(getErrorMessage(null)).toBe('Unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('Unknown error occurred');
      expect(getErrorMessage({})).toBe('Unknown error occurred');
      expect(getErrorMessage(123)).toBe('Unknown error occurred');
    });
  });
});
