import { NextRequest, NextResponse } from 'next/server';
import { createSDKClient } from '@/lib/sdk/client';
import { randomBytes } from 'crypto';

/**
 * OAuth Installation Route
 * Initiates the OAuth flow for GoHighLevel integration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const installType = searchParams.get('type') || 'location'; // 'agency' or 'location'

    // Generate CSRF state for security
    const state = randomBytes(32).toString('hex');

    // Store state in KV for verification
    if (typeof globalThis !== 'undefined' && (globalThis as any)[process.env.KV_BINDING as string]) {
      const kv = (globalThis as any)[process.env.KV_BINDING as string] as KVNamespace;
      await kv.put(`oauth_state:${state}`, JSON.stringify({
        installType,
        createdAt: Date.now(),
      }), { expirationTtl: 600 }); // 10 minutes
    }

    // Create SDK client for OAuth URL generation
    const sdk = createSDKClient({
      clientId: process.env.HL_CLIENT_ID,
      clientSecret: process.env.HL_CLIENT_SECRET,
    });

    // Determine required scopes based on install type
    const scopes = ['calendars.readonly', 'calendars.write'];

    // Add OAuth scopes for agency installs
    if (installType === 'agency') {
      scopes.push('oauth.readonly', 'oauth.write');
    }

    const authUrl = sdk.getAuthorizationUrl(scopes, state);

    // Redirect to GoHighLevel OAuth
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('OAuth install error:', error);

    // Return error page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Installation Error</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .retry { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Installation Failed</h1>
            <p>There was an error starting the installation process. Please try again.</p>
            <a href="/auth/install" class="retry">Retry Installation</a>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
