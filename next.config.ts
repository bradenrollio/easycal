import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages Functions configuration
  serverExternalPackages: ['@cloudflare/workers-types'],

  // ESLint configuration
  eslint: {
    dirs: ['src'],
  },

  // Output configuration for Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    APP_BASE_URL: process.env['APP_BASE_URL'],
    HL_CLIENT_ID: process.env['HL_CLIENT_ID'],
    HL_CLIENT_SECRET: process.env['HL_CLIENT_SECRET'],
    HL_PIT: process.env['HL_PIT'],
    OAUTH_REDIRECT_URL: process.env['OAUTH_REDIRECT_URL'],
    SESSION_SECRET: process.env['SESSION_SECRET'],
    D1_BINDING: 'DB',
    KV_BINDING: 'EASYCAL_SESSIONS',
    QUEUE_BINDING: 'EASYCAL_JOBS',
    ENCRYPTION_KEY: process.env['ENCRYPTION_KEY'],
  },
};

export default nextConfig;
