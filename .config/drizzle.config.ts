import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    // This will be replaced by Cloudflare D1 binding at runtime
    url: 'file:./sqlite.db',
  },
});
