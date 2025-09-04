/**
 * @fileoverview Vitest configuration for EasyCal testing
 * @description Configures the testing environment with proper TypeScript support,
 * path aliases, and testing utilities.
 * @author AI Assistant
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    setupFiles: ['./src/test/setup.ts'],
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'functions-dist/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test/**',
        'src/types/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Globals
    globals: true,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/app': path.resolve(__dirname, './src/app'),
    },
  },
});
