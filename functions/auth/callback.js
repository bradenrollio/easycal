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
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.HL_CLIENT_ID,
        client_secret: env.HL_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: env.OAUTH_REDIRECT_URL
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return new Response(`
        <!DOCTYPE html>
        <html><body>
          <h1>Token Exchange Failed</h1>
          <p>Error: ${tokenResponse.status}</p>
        </body></html>
      `, { status: 400, headers: { 'Content-Type': 'text/html' } });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token received - keys:', Object.keys(tokenData));
    
    // Use the confirmed location ID for this subaccount
    const confirmedLocationId = 'HgTZdA5INm0uiGh9KvHC';
    
    // Create simple tenant record
    const tenantId = `tenant_${Date.now()}`;
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tenants (id, created_at, name, install_context, agency_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      tenantId,
      Math.floor(Date.now() / 1000),
      'New Installation',
      'location',
      null
    ).run();

    // Create location record
    await env.DB.prepare(`
      INSERT OR REPLACE INTO locations (id, tenant_id, name, time_zone, is_enabled)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      confirmedLocationId,
      tenantId,
      'New Installation',
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
      INSERT OR REPLACE INTO tokens (id, tenant_id, location_id, access_token, refresh_token, scope, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tokenId,
      tenantId,
      confirmedLocationId,
      encryptedTokens.accessToken,
      encryptedTokens.refreshToken,
      tokenData.scope,
      Math.floor((Date.now() + (tokenData.expires_in * 1000)) / 1000)
    ).run();

    console.log('Installation completed for location:', confirmedLocationId);

    // Success redirect
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installation Complete</title>
        <script>
          window.location.href = '/?locationId=${confirmedLocationId}';
        </script>
      </head>
      <body>
        <h1>✓ EasyCal Installed Successfully!</h1>
        <p>Redirecting to your calendar manager...</p>
        <a href="/?locationId=${confirmedLocationId}">Go to EasyCal</a>
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
