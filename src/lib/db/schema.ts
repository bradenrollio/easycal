/**
 * @fileoverview Database schema definitions using Drizzle ORM
 * @description Defines all database tables, relationships, and type exports for the EasyCal application.
 * @author AI Assistant
 */

import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/**
 * Tenants table - represents the installing company/agency
 * @description Stores information about organizations that install the EasyCal app.
 * Supports both agency-level and location-level installations.
 */
export const tenants = sqliteTable('tenants', {
  /** Unique tenant identifier (UUID format) */
  id: text('id').primaryKey(),
  /** Timestamp when tenant was created (Unix epoch) */
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  /** Display name of the tenant organization */
  name: text('name').notNull(),
  /** Installation context: 'agency' or 'location' */
  installContext: text('install_context').notNull(),
  /** Parent agency ID (only for location-level installs) */
  agencyId: text('agency_id'),
});

/**
 * Locations table - represents sub-accounts/locations within a tenant
 * @description Stores CRM location/sub-account information.
 * Each location can have its own calendars and brand settings.
 */
export const locations = sqliteTable('locations', {
  /** CRM location ID */
  id: text('id').primaryKey(),
  /** Reference to parent tenant */
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  /** Location display name */
  name: text('name').notNull(),
  /** IANA timezone identifier (e.g., 'America/New_York') */
  timeZone: text('time_zone').notNull(),
  /** Whether location is active for calendar operations */
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),
}, (table) => ({
  /** Index for efficient tenant-based queries */
  tenantIdx: index('locations_tenant_idx').on(table.tenantId),
}));

/**
 * Tokens table - encrypted OAuth tokens per location
 * @description Stores encrypted CRM OAuth access and refresh tokens.
 * Supports both agency-level and location-specific tokens.
 */
export const tokens = sqliteTable('tokens', {
  /** Unique token record identifier */
  id: text('id').primaryKey(),
  /** Reference to owning tenant */
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  /** Reference to specific location (null for agency-level tokens) */
  locationId: text('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  /** Encrypted OAuth access token */
  accessToken: text('access_token').notNull(),
  /** Encrypted OAuth refresh token */
  refreshToken: text('refresh_token').notNull(),
  /** OAuth scope granted */
  scope: text('scope').notNull(),
  /** Token expiration timestamp (Unix epoch) */
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  /** Composite index for tenant-location queries */
  tenantLocationIdx: index('tokens_tenant_location_idx').on(table.tenantId, table.locationId),
  /** Index for token expiration cleanup */
  expiresIdx: index('tokens_expires_idx').on(table.expiresAt),
}));

/**
 * Jobs table - background job tracking for bulk operations
 * @description Tracks long-running operations like bulk calendar creation/deletion.
 * Provides progress monitoring and error tracking.
 */
export const jobs = sqliteTable('jobs', {
  /** Unique job identifier (UUID format) */
  id: text('id').primaryKey(),
  /** Reference to tenant that initiated the job */
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  /** Reference to specific location (null for tenant-wide jobs) */
  locationId: text('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  /** Job type: 'create_calendars' | 'delete_calendars' */
  type: text('type').notNull(),
  /** Job status: 'queued' | 'running' | 'success' | 'error' */
  status: text('status').notNull(),
  /** Total number of items to process */
  total: integer('total').notNull(),
  /** Number of successfully processed items */
  successCount: integer('success_count').default(0),
  /** Number of failed items */
  errorCount: integer('error_count').default(0),
  /** Job creation timestamp */
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  /** Last update timestamp */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  /** Index for tenant-based job queries */
  tenantIdx: index('jobs_tenant_idx').on(table.tenantId),
  /** Index for status-based filtering */
  statusIdx: index('jobs_status_idx').on(table.status),
  /** Index for chronological ordering */
  createdIdx: index('jobs_created_idx').on(table.createdAt),
}));

/**
 * Job items table - individual items within a bulk job
 * @description Stores individual calendar operations within a bulk job.
 * Enables granular tracking and error reporting.
 */
export const jobItems = sqliteTable('job_items', {
  /** Unique job item identifier */
  id: text('id').primaryKey(),
  /** Reference to parent job */
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  /** JSON input data for this item (e.g., calendar creation data) */
  input: text('input', { mode: 'json' }).notNull(),
  /** JSON result data after processing (e.g., created calendar info) */
  result: text('result', { mode: 'json' }),
  /** Item status: 'pending' | 'processing' | 'success' | 'error' */
  status: text('status').notNull(),
  /** Error message if processing failed */
  errorMessage: text('error_message'),
}, (table) => ({
  /** Index for job-based item queries */
  jobIdx: index('job_items_job_idx').on(table.jobId),
  /** Index for status-based filtering */
  statusIdx: index('job_items_status_idx').on(table.status),
}));

/**
 * Type exports for TypeScript inference
 * @description Automatically inferred types from Drizzle schema definitions.
 * Use these types throughout the application for type safety.
 */

/** Tenant record type (for SELECT operations) */
export type Tenant = typeof tenants.$inferSelect;
/** New tenant data type (for INSERT operations) */
export type NewTenant = typeof tenants.$inferInsert;

/** Location record type (for SELECT operations) */
export type Location = typeof locations.$inferSelect;
/** New location data type (for INSERT operations) */
export type NewLocation = typeof locations.$inferInsert;

/** Token record type (for SELECT operations) */
export type Token = typeof tokens.$inferSelect;
/** New token data type (for INSERT operations) */
export type NewToken = typeof tokens.$inferInsert;

/** Job record type (for SELECT operations) */
export type Job = typeof jobs.$inferSelect;
/** New job data type (for INSERT operations) */
export type NewJob = typeof jobs.$inferInsert;

/** Job item record type (for SELECT operations) */
export type JobItem = typeof jobItems.$inferSelect;
/** New job item data type (for INSERT operations) */
export type NewJobItem = typeof jobItems.$inferInsert;
