import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages Functions configuration
  serverExternalPackages: ['@cloudflare/workers-types'],

  // Security headers for iframe embedding
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL', // Allow iframe embedding
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors *", // Allow embedding in any iframe
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Output configuration for Cloudflare Pages
  output: 'standalone',
  images: {
    unoptimized: true,
  },

  // Environment variables
  env: {
    APP_BASE_URL: process.env.APP_BASE_URL,
    HL_CLIENT_ID: process.env.HL_CLIENT_ID,
    HL_CLIENT_SECRET: process.env.HL_CLIENT_SECRET,
    HL_PIT: process.env.HL_PIT,
    SESSION_SECRET: process.env.SESSION_SECRET,
    D1_BINDING: process.env.D1_BINDING,
    KV_BINDING: process.env.KV_BINDING,
    QUEUE_BINDING: process.env.QUEUE_BINDING,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  },
};

export default nextConfig;
