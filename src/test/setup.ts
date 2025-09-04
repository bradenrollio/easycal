/**
 * @fileoverview Global test setup configuration
 * @description Sets up testing environment, mocks, and utilities
 * for consistent test execution across the application.
 * @author AI Assistant
 */

import React from 'react';
import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend expect with custom matchers
import '@testing-library/jest-dom';

// Global test setup
beforeAll(() => {
  // Mock environment variables
  Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
  Object.defineProperty(process.env, 'APP_BASE_URL', { value: 'https://test.example.com', writable: true });
  Object.defineProperty(process.env, 'HL_CLIENT_ID', { value: 'test-client-id', writable: true });
  Object.defineProperty(process.env, 'HL_CLIENT_SECRET', { value: 'test-client-secret', writable: true });
  Object.defineProperty(process.env, 'ENCRYPTION_KEY', { value: 'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcw==', writable: true });
});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock crypto for encryption tests
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      importKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
    },
    randomBytes: vi.fn(),
  },
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock Next.js image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return React.createElement('img', { src, alt, ...props });
  },
}));

// Console suppression for cleaner test output
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Suppress React warnings in tests unless explicitly needed
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('React'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
