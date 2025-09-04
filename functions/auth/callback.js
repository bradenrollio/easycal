export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    console.log('Callback received with code:', code ? 'present' : 'missing');
    console.log('State:', state);
    
    if (!code) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Error</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Authorization Error</h1>
            <p>No authorization code received.</p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Exchange authorization code for access tokens
    const tokenResponse = await exchangeCodeForTokens(code, env);
    
    if (!tokenResponse.success) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Error</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Authorization Error</h1>
            <p>Failed to exchange authorization code: ${tokenResponse.error}</p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Store tokens and create tenant/location records
    const installResult = await completeInstallation(tokenResponse.data, env);
    
    if (!installResult.success) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Installation Error</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Installation Error</h1>
            <p>Failed to complete installation: ${installResult.error}</p>
          </div>
        </body>
        </html>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Success! Redirect to app
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installation Complete</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .success { color: #059669; background: #f0fdf4; padding: 20px; border-radius: 8px; }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
        <script>
          // Auto-redirect immediately to the app with location context
          window.location.href = '/?locationId=${installResult.locationId}';
        </script>
      </head>
      <body>
        <div class="success">
          <h1>✓ EasyCal Installed Successfully!</h1>
          <p>Your GoHighLevel account is now connected to EasyCal.</p>
          <p><strong>Location:</strong> ${installResult.locationName}</p>
          <p>Redirecting to your calendar manager...</p>
          <a href="/?locationId=${installResult.locationId}" class="btn">Go to EasyCal</a>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Callback error:', error);
    
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Callback Error</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>Callback Error</h1>
          <p>${error.message}</p>
        </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Exchange authorization code for access tokens
async function exchangeCodeForTokens(code, env) {
  try {
    const tokenRequest = {
      client_id: env.HL_CLIENT_ID,
      client_secret: env.HL_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: env.OAUTH_REDIRECT_URL
    };

    console.log('Exchanging code for tokens...');
    
    const response = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenRequest).toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', response.status, errorText);
      return { success: false, error: `Token exchange failed: ${response.status}` };
    }

    const tokenData = await response.json();
    console.log('Token exchange successful');
    console.log('Full token response:', JSON.stringify(tokenData, null, 2));
    
    return { success: true, data: tokenData };
  } catch (error) {
    console.error('Token exchange error:', error);
    return { success: false, error: error.message };
  }
}

// Complete the installation by storing tokens and creating records
async function completeInstallation(tokenData, env) {
  try {
    // For marketplace OAuth installations, we'll create a generic tenant
    // The actual location ID will be determined when the user first accesses the app
    // This approach works around the API endpoint limitations in Cloudflare Workers
    
    // Parse the scope to get any location information
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : [];
    console.log('Token scopes:', scopes);
    console.log('Token data keys:', Object.keys(tokenData));
    
    // For GHL marketplace apps, the location_id should be in the token response
    // Let's check all possible fields where it might be
    const locationId = tokenData.location_id || tokenData.locationId || tokenData.companyId || `temp_${Date.now()}`;
    const locationName = tokenData.name || tokenData.companyName || tokenData.businessName || 'New Installation';
    const isAgencyInstall = scopes.includes('oauth.readonly') && scopes.includes('oauth.write');
    
    console.log('Extracted location info:', {
      locationId,
      locationName,
      isAgencyInstall,
      tokenDataKeys: Object.keys(tokenData),
      fullTokenData: tokenData
    });
    
    // The location ID might be in a different field - let's check all possible fields
    console.log('Checking all possible location ID fields:', {
      'tokenData.location_id': tokenData.location_id,
      'tokenData.locationId': tokenData.locationId,
      'tokenData.companyId': tokenData.companyId,
      'tokenData.company_id': tokenData.company_id,
      'tokenData.sub': tokenData.sub,
      'tokenData.aud': tokenData.aud,
      'tokenData.scope': tokenData.scope
    });

    // Create tenant record
    const tenantId = generateId();
    const tenantData = {
      id: tenantId,
      name: locationName,
      installContext: isAgencyInstall ? 'agency' : 'location',
      agencyId: isAgencyInstall ? tokenData.companyId : null,
      createdAt: Math.floor(Date.now() / 1000)
    };

    // Store tenant in D1
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tenants (id, created_at, name, install_context, agency_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      tenantData.id,
      tenantData.createdAt,
      tenantData.name,
      tenantData.installContext,
      tenantData.agencyId
    ).run();

    // Create location record
    const locationData = {
      id: locationId,
      tenantId: tenantId,
      name: locationName,
      timeZone: tokenData.timezone || 'America/New_York',
      isEnabled: true
    };

    await env.DB.prepare(`
      INSERT OR REPLACE INTO locations (id, tenant_id, name, time_zone, is_enabled)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      locationData.id,
      locationData.tenantId,
      locationData.name,
      locationData.timeZone,
      locationData.isEnabled ? 1 : 0
    ).run();

    // Encrypt and store tokens
    const encryptedTokens = await encryptTokens({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    }, env.ENCRYPTION_KEY);

    const tokenId = generateId();
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tokens (id, tenant_id, location_id, access_token, refresh_token, scope, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tokenId,
      tenantId,
      locationId,
      encryptedTokens.accessToken,
      encryptedTokens.refreshToken,
      tokenData.scope,
      Math.floor((Date.now() + (tokenData.expires_in * 1000)) / 1000)
    ).run();

    console.log('Installation completed successfully');

    return {
      success: true,
      locationId: locationId,
      locationName: locationName,
      tenantId: tenantId
    };

  } catch (error) {
    console.error('Installation error:', error);
    return { success: false, error: error.message };
  }
}

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Encrypt tokens using Web Crypto API
async function encryptTokens(tokens, encryptionKey) {
  try {
    // Import the encryption key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(encryptionKey.substring(0, 32)), // Ensure 32 bytes
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt access token
    const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const accessTokenBuffer = new TextEncoder().encode(tokens.accessToken);
    const encryptedAccessToken = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: accessTokenIv },
      key,
      accessTokenBuffer
    );

    // Encrypt refresh token
    const refreshTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const refreshTokenBuffer = new TextEncoder().encode(tokens.refreshToken);
    const encryptedRefreshToken = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: refreshTokenIv },
      key,
      refreshTokenBuffer
    );

    // Convert to base64 for storage
    const accessTokenB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedAccessToken)));
    const accessTokenIvB64 = btoa(String.fromCharCode(...accessTokenIv));
    const refreshTokenB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedRefreshToken)));
    const refreshTokenIvB64 = btoa(String.fromCharCode(...refreshTokenIv));

    return {
      accessToken: `${accessTokenB64}:${accessTokenIvB64}`,
      refreshToken: `${refreshTokenB64}:${refreshTokenIvB64}`
    };

  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt tokens');
  }
}
