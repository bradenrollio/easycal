import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// Tenants table - represents the installing company/agency
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  name: text('name').notNull(),
  installContext: text('install_context').notNull(), // 'agency' or 'location'
  agencyId: text('agency_id'), // Only for location-level installs
});

// Locations table - represents sub-accounts/locations
export const locations = sqliteTable('locations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  timeZone: text('time_zone').notNull(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),
}, (table) => ({
  tenantIdx: index('locations_tenant_idx').on(table.tenantId),
}));

// Tokens table - encrypted OAuth tokens per location
export const tokens = sqliteTable('tokens', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  locationId: text('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(), // Encrypted
  refreshToken: text('refresh_token').notNull(), // Encrypted
  scope: text('scope').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  tenantLocationIdx: index('tokens_tenant_location_idx').on(table.tenantId, table.locationId),
  expiresIdx: index('tokens_expires_idx').on(table.expiresAt),
}));

// Jobs table - background job tracking
export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  locationId: text('location_id').references(() => locations.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'create_calendars' | 'delete_calendars'
  status: text('status').notNull(), // 'queued' | 'running' | 'success' | 'error'
  total: integer('total').notNull(),
  successCount: integer('success_count').default(0),
  errorCount: integer('error_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  tenantIdx: index('jobs_tenant_idx').on(table.tenantId),
  statusIdx: index('jobs_status_idx').on(table.status),
  createdIdx: index('jobs_created_idx').on(table.createdAt),
}));

// Job items table - individual items within a job
export const jobItems = sqliteTable('job_items', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  input: text('input', { mode: 'json' }).notNull(), // JSON input data
  result: text('result', { mode: 'json' }), // JSON result data
  status: text('status').notNull(), // 'pending' | 'processing' | 'success' | 'error'
  errorMessage: text('error_message'),
}, (table) => ({
  jobIdx: index('job_items_job_idx').on(table.jobId),
  statusIdx: index('job_items_status_idx').on(table.status),
}));

// Type exports for TypeScript
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;

export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

export type JobItem = typeof jobItems.$inferSelect;
export type NewJobItem = typeof jobItems.$inferInsert;
