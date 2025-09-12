// Simplified OAuth Callback - Robust location ID handling
export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    console.log('Simple OAuth callback - Code received:', code ? 'YES' : 'NO');
    console.log('Full callback URL:', request.url);
    
    if (!code) {
      return new Response(`
        <!DOCTYPE html>
        <html><body>
          <h1>Authorization Error</h1>
          <p>No authorization code received.</p>
        </body></html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } });
    }
    
    // Exchange code for token
    console.log('Exchanging code for token with params:', {
      client_id: env.HL_CLIENT_ID,
      redirect_uri: env.OAUTH_REDIRECT_URL,
      code_length: code.length
    });
    
    // Use the correct OAuth token endpoint
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.HL_CLIENT_ID,
        client_secret: env.HL_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: env.OAUTH_REDIRECT_URL,
        user_type: 'Location'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      
      // Parse error for better messaging
      let errorMessage = `Status: ${tokenResponse.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error_description || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      
      return new Response(`
        <!DOCTYPE html>
        <html><body>
          <h1>Token Exchange Failed</h1>
          <p>Error: ${errorMessage}</p>
          <p><small>Please ensure you have authorized the application and try again.</small></p>
          <p><a href="/">Return to EasyCal</a></p>
        </body></html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token received - keys:', Object.keys(tokenData));
    console.log('Full token data:', tokenData);
    
    // Extract location ID from token response
    const locationId = tokenData.locationId;
    const userType = tokenData.userType;
    const companyId = tokenData.companyId;
    const isBulkInstallation = tokenData.isBulkInstallation;
    
    console.log('Token exchange successful:', {
      userType,
      locationId,
      companyId,
      isBulkInstallation
    });
    
    // For bulk installations or agency installs, we might not get a locationId
    // In this case, we need to handle it as an agency installation
    if (!locationId && (userType === 'Company' || isBulkInstallation)) {
      console.log('Agency/bulk installation detected - storing agency token for later location selection');
      
      // Store as agency token and redirect to location selection
      const tenantId = `tenant_${Date.now()}`;
      
      await env.DB.prepare(`
        INSERT OR REPLACE INTO tenants (id, created_at, name, install_context, agency_id)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        tenantId,
        Math.floor(Date.now() / 1000),
        'Agency Installation',
        'agency',
        companyId
      ).run();

      // Encrypt and store agency token
      const encryptedTokens = await encryptTokens({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token
      }, env.ENCRYPTION_KEY);

      const tokenId = `token_${Date.now()}`;
      await env.DB.prepare(`
        INSERT OR REPLACE INTO tokens (id, tenant_id, location_id, access_token, refresh_token, scope, expires_at, user_type, company_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tokenId,
        tenantId,
        null, // No specific location for agency tokens
        encryptedTokens.accessToken,
        encryptedTokens.refreshToken,
        tokenData.scope,
        Math.floor((Date.now() + (tokenData.expires_in * 1000)) / 1000),
        userType,
        companyId
      ).run();

      // Redirect to agency dashboard
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Installation Complete</title>
          <script>
            window.location.href = '/?companyId=${companyId}&userType=agency';
          </script>
        </head>
        <body>
          <h1>✓ EasyCal Installed Successfully!</h1>
          <p>Agency-level installation complete! Redirecting...</p>
          <a href="/?companyId=${companyId}&userType=agency">Go to EasyCal</a>
        </body>
        </html>
      `, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    if (!locationId) {
      console.error('No location ID found in token response');
      return new Response(`
        <!DOCTYPE html>
        <html><body>
          <h1>Installation Error</h1>
          <p>Unable to determine location context. Please try installing from within a specific location.</p>
        </body></html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } });
    }
    
    // Create tenant record
    const tenantId = `tenant_${Date.now()}`;
    const installContext = 'location'; // Always location for sub-account apps
    
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tenants (id, created_at, name, install_context, agency_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      tenantId,
      Math.floor(Date.now() / 1000),
      'Location Installation',
      installContext,
      companyId
    ).run();

    // Create location record
    await env.DB.prepare(`
      INSERT OR REPLACE INTO locations (id, tenant_id, name, time_zone, is_enabled)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      locationId,
      tenantId,
      'Location Installation',
      'America/New_York',
      1
    ).run();

    // Encrypt and store token
    const encryptedTokens = await encryptTokens({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token
    }, env.ENCRYPTION_KEY);

    const tokenId = `token_${Date.now()}`;
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tokens (id, tenant_id, location_id, access_token, refresh_token, scope, expires_at, user_type, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tokenId,
      tenantId,
      locationId,
      encryptedTokens.accessToken,
      encryptedTokens.refreshToken,
      tokenData.scope,
      Math.floor((Date.now() + (tokenData.expires_in * 1000)) / 1000),
      userType,
      companyId
    ).run();

    console.log('Installation completed:', {
      locationId,
      userType,
      companyId,
      installContext
    });

    // Success redirect - always redirect to location since we're getting location tokens
    const redirectUrl = `/?locationId=${locationId}`;
    const successMessage = 'Installation complete! You can now manage calendars for this location.';

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installation Complete</title>
        <script>
          window.location.href = '${redirectUrl}';
        </script>
      </head>
      <body>
        <h1>✓ EasyCal Installed Successfully!</h1>
        <p>${successMessage}</p>
        <p>Redirecting to your calendar manager...</p>
        <a href="${redirectUrl}">Go to EasyCal</a>
      </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(`
      <!DOCTYPE html>
      <html><body>
        <h1>Installation Error</h1>
        <p>Error: ${error.message}</p>
      </body></html>
    `, { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

// Simple token encryption
async function encryptTokens(tokens, encryptionKey) {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt access token
    const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedAccessToken = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: accessTokenIv },
      key,
      new TextEncoder().encode(tokens.accessToken)
    );

    // Encrypt refresh token
    const refreshTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedRefreshToken = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: refreshTokenIv },
      key,
      new TextEncoder().encode(tokens.refreshToken)
    );

    return {
      accessToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedAccessToken)))}:${btoa(String.fromCharCode(...accessTokenIv))}`,
      refreshToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedRefreshToken)))}:${btoa(String.fromCharCode(...refreshTokenIv))}`
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt tokens');
  }
}
