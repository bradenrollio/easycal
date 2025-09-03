import { NextRequest, NextResponse } from 'next/server';
import { createSDKClient } from '@/lib/sdk/client';
import { createDbClient } from '@/lib/db/client';
import { tenants, locations, tokens } from '@/lib/db/schema';
import { encrypt, getEncryptionKey } from '@/lib/db/encryption';
import { eq } from 'drizzle-orm';

/**
 * OAuth Callback Route
 * Handles the authorization code exchange and token storage
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  try {
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      return new NextResponse(
        `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Failed</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; }
              .error { color: #dc3545; background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>Authorization Failed</h1>
              <p>${errorDescription || 'Access was denied or an error occurred.'}</p>
              <p>Please try installing again.</p>
            </div>
          </body>
        </html>
        `,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    if (!code || !state) {
      return new NextResponse('Missing authorization code or state', { status: 400 });
    }

    // Verify state for CSRF protection
    if (typeof globalThis !== 'undefined' && (globalThis as any)[process.env.KV_BINDING as string]) {
      const kv = (globalThis as any)[process.env.KV_BINDING as string] as KVNamespace;
      const storedState = await kv.get(`oauth_state:${state}`);

      if (!storedState) {
        return new NextResponse('Invalid or expired state parameter', { status: 400 });
      }

      // Clean up used state
      await kv.delete(`oauth_state:${state}`);
    }

    // Exchange authorization code for tokens
    const sdk = createSDKClient({
      clientId: process.env.HL_CLIENT_ID,
      clientSecret: process.env.HL_CLIENT_SECRET,
    });

    const tokenResponse = await sdk.exchangeCode(code);

    // Get database client
    if (!globalThis[process.env.D1_BINDING as string]) {
      throw new Error('Database not available');
    }

    const db = createDbClient(globalThis[process.env.D1_BINDING as string] as D1Database);
    const encryptionKey = await getEncryptionKey();

    // Extract tenant/location information from token response
    const {
      access_token,
      refresh_token,
      expires_in,
      scope,
      locationId,
      companyId,
      userId,
    } = await sdk.exchangeCode(code) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      scope: string;
      locationId: string;
      companyId: string;
      userId: string;
    };

    // Determine if this is an agency or location install
    const isAgencyInstall = scope.includes('oauth.write');
    const tenantId = isAgencyInstall ? companyId : locationId;

    // Check if tenant already exists
    const tenantResult = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    let tenant = tenantResult[0];

    if (!tenant) {
      // Create new tenant
      const newTenant = {
        id: tenantId,
        name: `Company ${companyId}`, // Will be updated with actual name later
        installContext: isAgencyInstall ? 'agency' : 'location',
        agencyId: isAgencyInstall ? undefined : companyId,
        createdAt: new Date(),
      };
      await db.insert(tenants).values(newTenant);
      tenant = newTenant;
    }

    // Handle location setup
    if (isAgencyInstall) {
      // For agency installs, we need to get available locations
      const agencySdk = createSDKClient({
        accessToken: access_token,
        refreshToken: refresh_token,
      });

      const locationsList = await agencySdk.listLocations() as {
        locations: Array<{
          id: string;
          name: string;
          timezone: string;
        }>;
      };

      // Create location records for all available locations
      for (const loc of locationsList.locations || []) {
        const existingLocation = await db
          .select()
          .from(locations)
          .where(eq(locations.id, loc.id))
          .limit(1);

        if (existingLocation.length === 0) {
          await db.insert(locations).values({
            id: loc.id,
            tenantId: tenantId,
            name: loc.name,
            timeZone: loc.timezone || 'UTC',
            isEnabled: true,
          });
        }
      }
    } else {
      // For location installs, create single location record
      const existingLocation = await db
        .select()
        .from(locations)
        .where(eq(locations.id, locationId))
        .limit(1);

      if (existingLocation.length === 0) {
        await db.insert(locations).values({
          id: locationId,
          tenantId: tenantId,
          name: `Location ${locationId}`,
          timeZone: 'UTC', // Will be updated with actual timezone
          isEnabled: true,
        });
      }
    }

    // Encrypt and store tokens
    const encryptedAccessToken = await encrypt(access_token, encryptionKey);
    const encryptedRefreshToken = await encrypt(refresh_token, encryptionKey);

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Store tokens
    await db.insert(tokens).values({
      id: `${tenantId}_${locationId || 'agency'}_${Date.now()}`,
      tenantId: tenantId,
      locationId: isAgencyInstall ? undefined : locationId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      scope: scope,
      expiresAt: expiresAt,
    });

    // Redirect to success page or dashboard
    const redirectUrl = new URL('/?installed=true', process.env.APP_BASE_URL);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('OAuth callback error:', error);

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Installation Failed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc3545; background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Installation Failed</h1>
            <p>There was an error completing the installation. Please try again.</p>
            <p>Error: ${error.message}</p>
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
