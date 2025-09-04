/**
 * @fileoverview Unified utility exports
 * @description Central export point for all utility functions.
 * Provides clean imports and better organization.
 * @author AI Assistant
 */

// Validation utilities
export {
  validateColor,
  validateButtonText,
  validateTimezone,
  validateBrandConfig,
  validateCSVRow,
  parseScheduleBlocks,
  slugify
} from './validation';

// Formatting utilities  
export {
  getCommonTimezones,
  normalizeTime,
  to24h,
  ensureGroup
} from './formatting';

// Crypto utilities (when we add them)
// export * from './crypto';

/**
 * Common utility functions
 */

/**
 * Delays execution for specified milliseconds
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 * 
 * @example
 * ```typescript
 * await delay(1000); // Wait 1 second
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a random UUID v4
 * @returns UUID v4 string
 * 
 * @example
 * ```typescript
 * const id = generateId(); // "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 * ```
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Safely parses JSON with fallback
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 * 
 * @example
 * ```typescript
 * const data = safeJsonParse('{"key": "value"}', {});
 * const invalid = safeJsonParse('invalid json', null);
 * ```
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Debounces a function call
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 * 
 * @example
 * ```typescript
 * const debouncedSearch = debounce((query: string) => {
 *   console.log('Searching:', query);
 * }, 300);
 * ```
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttles a function call
 * @param fn - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 * 
 * @example
 * ```typescript
 * const throttledScroll = throttle(() => {
 *   console.log('Scrolling');
 * }, 100);
 * ```
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}
