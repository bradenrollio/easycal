/**
 * @fileoverview Testing utilities and helpers
 * @description Provides reusable testing utilities, mock factories,
 * and custom render functions for consistent testing.
 * @author AI Assistant
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi, expect } from 'vitest';
import type { 
  Tenant, 
  Location, 
  Token, 
  Job, 
  JobItem 
} from '@/lib/db/schema';
import type { 
  BrandConfig, 
  CalendarPayload, 
  CSVCalendarRow
} from '@/types/brand';
import type { 
  GHLCalendar,
  GHLGroup 
} from '@/lib/api/ghl/client';

/**
 * Custom render function with default providers
 * @param ui - React component to render
 * @param options - Render options
 * @returns Render result with testing utilities
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <div data-testid="test-wrapper">
        {children}
      </div>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Mock factory for Tenant objects
 * @param overrides - Properties to override
 * @returns Mock Tenant object
 */
export function createMockTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-123',
    createdAt: new Date('2024-01-01'),
    name: 'Test Tenant',
    installContext: 'agency',
    agencyId: null,
    ...overrides,
  };
}

/**
 * Mock factory for Location objects
 * @param overrides - Properties to override
 * @returns Mock Location object
 */
export function createMockLocation(overrides: Partial<Location> = {}): Location {
  return {
    id: 'location-123',
    tenantId: 'tenant-123',
    name: 'Test Location',
    timeZone: 'America/New_York',
    isEnabled: true,
    ...overrides,
  };
}

/**
 * Mock factory for Token objects
 * @param overrides - Properties to override
 * @returns Mock Token object
 */
export function createMockToken(overrides: Partial<Token> = {}): Token {
  return {
    id: 'token-123',
    tenantId: 'tenant-123',
    locationId: 'location-123',
    accessToken: 'encrypted-access-token',
    refreshToken: 'encrypted-refresh-token',
    scope: 'calendars.read calendars.write',
    expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    ...overrides,
  };
}

/**
 * Mock factory for Job objects
 * @param overrides - Properties to override
 * @returns Mock Job object
 */
export function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-123',
    tenantId: 'tenant-123',
    locationId: 'location-123',
    type: 'create_calendars',
    status: 'queued',
    total: 10,
    successCount: 0,
    errorCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Mock factory for JobItem objects
 * @param overrides - Properties to override
 * @returns Mock JobItem object
 */
export function createMockJobItem(overrides: Partial<JobItem> = {}): JobItem {
  return {
    id: 'job-item-123',
    jobId: 'job-123',
    input: { calendarName: 'Test Calendar' },
    result: null,
    status: 'pending',
    errorMessage: null,
    ...overrides,
  };
}

/**
 * Mock factory for BrandConfig objects
 * @param overrides - Properties to override
 * @returns Mock BrandConfig object
 */
export function createMockBrandConfig(overrides: Partial<BrandConfig> = {}): BrandConfig {
  return {
    locationId: 'location-123',
    primaryColorHex: '#FF0000',
    backgroundColorHex: '#FFFFFF',
    defaultButtonText: 'Book Now',
    defaultTimezone: 'America/New_York',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Mock factory for CalendarPayload objects
 * @param overrides - Properties to override
 * @returns Mock CalendarPayload object
 */
export function createMockCalendarPayload(overrides: Partial<CalendarPayload> = {}): CalendarPayload {
  return {
    locationId: 'location-123',
    name: 'Test Calendar',
    description: 'Test calendar description',
    widgetType: 'default',
    customizations: {
      primaryColor: '#FF0000',
      backgroundColor: '#FFFFFF',
      buttonText: 'Book Now',
    },
    duration: 30,
    timeZone: 'America/New_York',
    availability: {
      weekly: [
        { day: 'Monday', start: '09:00', end: '17:00' },
      ],
      slotInterval: 30,
    },
    minSchedulingNotice: 1,
    maxBookingsPerDay: 10,
    slug: 'test-calendar',
    ...overrides,
  };
}

/**
 * Mock factory for CSVCalendarRow objects
 * @param overrides - Properties to override
 * @returns Mock CSVCalendarRow object
 */
export function createMockCSVRow(overrides: Partial<CSVCalendarRow> = {}): CSVCalendarRow {
  return {
    calendar_type: 'event',
    calendar_name: 'Test Calendar',
    slot_interval_minutes: '30',
    class_duration_minutes: '60',
    min_scheduling_notice_days: '1',
    max_bookings_per_day: '10',
    schedule_blocks: 'Mon 09:00-10:00',
    calendar_group: 'Test Group',
    class_description: 'Test description',
    ...overrides,
  };
}

/**
 * Mock factory for GHLCalendar objects
 * @param overrides - Properties to override
 * @returns Mock GHLCalendar object
 */
export function createMockGHLCalendar(overrides: Partial<GHLCalendar> = {}): GHLCalendar {
  return {
    id: 'ghl-calendar-123',
    name: 'Test Calendar',
    slug: 'test-calendar',
    groupId: 'group-123',
    isActive: true,
    customizations: {
      primaryColor: '#FF0000',
      backgroundColor: '#FFFFFF',
      buttonText: 'Book Now',
    },
    ...overrides,
  };
}

/**
 * Mock factory for GHLGroup objects
 * @param overrides - Properties to override
 * @returns Mock GHLGroup object
 */
export function createMockGHLGroup(overrides: Partial<GHLGroup> = {}): GHLGroup {
  return {
    id: 'group-123',
    name: 'Test Group',
    slug: 'test-group',
    isActive: true,
    ...overrides,
  };
}

/**
 * Mock fetch response helper
 * @param data - Response data
 * @param status - HTTP status code
 * @returns Mock fetch response
 */
export function createMockResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Mock fetch implementation for testing
 * @param responses - Array of mock responses
 * @returns Mock fetch function
 */
export function createMockFetch(responses: Response[]): typeof fetch {
  let callCount = 0;
  return vi.fn().mockImplementation(() => {
    const response = responses[callCount] || responses[responses.length - 1];
    callCount++;
    return Promise.resolve(response);
  });
}

/**
 * Waits for async operations to complete
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after delay
 */
export function waitFor(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock database client for testing
 * @returns Mock database client
 */
export function createMockDb() {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    first: vi.fn(),
    all: vi.fn(),
  };
}

/**
 * Asserts that a function throws with specific error message
 * @param fn - Function to test
 * @param expectedMessage - Expected error message
 */
export async function expectToThrow(
  fn: () => Promise<unknown>,
  expectedMessage?: string
): Promise<void> {
  let error: Error | null = null;
  
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }
  
  expect(error).not.toBeNull();
  if (expectedMessage) {
    expect(error?.message).toContain(expectedMessage);
  }
}
