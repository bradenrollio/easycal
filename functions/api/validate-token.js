// Validate Token API - Test token validation and refresh mechanism
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const locationId = url.searchParams.get('locationId');
    const forceExpire = url.searchParams.get('forceExpire') === 'true';
    
    if (!locationId) {
      return new Response(JSON.stringify({ 
        error: 'locationId parameter is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    console.log('=== TOKEN VALIDATION TEST ===');
    console.log('Location ID:', locationId);
    console.log('Force Expire:', forceExpire);
    
    // Step 1: Check if token exists in database
    const tokenRecord = await env.DB.prepare(`
      SELECT id, access_token, refresh_token, expires_at, location_id
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId).first();
    
    if (!tokenRecord) {
      console.log('❌ No token found in database for location:', locationId);
      return new Response(JSON.stringify({
        success: false,
        step: 'database_check',
        message: 'No token found in database',
        locationId: locationId
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    console.log('✅ Token found in database');
    console.log('Token ID:', tokenRecord.id);
    console.log('Expires at:', new Date(tokenRecord.expires_at * 1000).toISOString());
    
    // Step 2: Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    const isExpired = tokenRecord.expires_at <= now;
    const expiresIn = tokenRecord.expires_at - now;
    
    console.log('Current time:', new Date(now * 1000).toISOString());
    console.log('Token expired?', isExpired);
    console.log('Expires in (seconds):', expiresIn);
    
    // If forceExpire is true, artificially expire the token for testing
    if (forceExpire && !isExpired) {
      console.log('⚠️ Force expiring token for testing...');
      await env.DB.prepare(`
        UPDATE tokens 
        SET expires_at = ?
        WHERE id = ?
      `).bind(
        now - 3600, // Set to 1 hour ago
        tokenRecord.id
      ).run();
      
      tokenRecord.expires_at = now - 3600;
    }
    
    // Step 3: Test token refresh if expired
    if (tokenRecord.expires_at <= now) {
      console.log('🔄 Token is expired, attempting refresh...');
      
      try {
        // Decrypt refresh token
        const refreshToken = await decryptToken(tokenRecord.refresh_token, env.ENCRYPTION_KEY);
        console.log('✅ Refresh token decrypted successfully');
        
        // Attempt to refresh
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: env.HL_CLIENT_ID,
            client_secret: env.HL_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            user_type: 'Location'
          }).toString()
        });
        
        console.log('Refresh API response status:', tokenResponse.status);
        
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('❌ Token refresh failed:', errorText);
          return new Response(JSON.stringify({
            success: false,
            step: 'token_refresh',
            message: 'Failed to refresh token',
            error: errorText,
            status: tokenResponse.status
          }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        const newTokenData = await tokenResponse.json();
        console.log('✅ Token refreshed successfully');
        console.log('New token expires in:', newTokenData.expires_in, 'seconds');
        
        // Encrypt and update the token
        const encryptedTokens = await encryptTokens({
          accessToken: newTokenData.access_token,
          refreshToken: newTokenData.refresh_token || refreshToken
        }, env.ENCRYPTION_KEY);
        
        const newExpiresAt = Math.floor((Date.now() + (newTokenData.expires_in * 1000)) / 1000);
        
        await env.DB.prepare(`
          UPDATE tokens 
          SET access_token = ?, 
              refresh_token = ?,
              expires_at = ?
          WHERE id = ?
        `).bind(
          encryptedTokens.accessToken,
          encryptedTokens.refreshToken,
          newExpiresAt,
          tokenRecord.id
        ).run();
        
        console.log('✅ Database updated with new token');
        
        // Test the new token
        const testResponse = await fetch(`https://services.leadconnectorhq.com/calendars?locationId=${locationId}`, {
          headers: {
            'Authorization': `Bearer ${newTokenData.access_token}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Test API call with new token:', testResponse.status);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Token was expired and successfully refreshed',
          tokenStatus: {
            wasExpired: true,
            refreshed: true,
            newExpiresAt: new Date(newExpiresAt * 1000).toISOString(),
            testApiCall: testResponse.ok ? 'success' : 'failed'
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      } catch (refreshError) {
        console.error('❌ Error during refresh process:', refreshError);
        return new Response(JSON.stringify({
          success: false,
          step: 'refresh_error',
          message: 'Error during refresh process',
          error: refreshError.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // Step 4: Token is valid, test it
    console.log('✅ Token is valid, testing API call...');
    
    try {
      const accessToken = await decryptToken(tokenRecord.access_token, env.ENCRYPTION_KEY);
      
      const testResponse = await fetch(`https://services.leadconnectorhq.com/calendars?locationId=${locationId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Test API call status:', testResponse.status);
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error('API call failed:', errorText);
        
        return new Response(JSON.stringify({
          success: false,
          message: 'Token exists but API call failed',
          tokenStatus: {
            wasExpired: false,
            expiresIn: expiresIn,
            apiError: errorText,
            apiStatus: testResponse.status
          }
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      const calendarsData = await testResponse.json();
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Token is valid and working',
        tokenStatus: {
          wasExpired: false,
          expiresAt: new Date(tokenRecord.expires_at * 1000).toISOString(),
          expiresIn: `${Math.floor(expiresIn / 3600)} hours ${Math.floor((expiresIn % 3600) / 60)} minutes`,
          testApiCall: 'success',
          calendarsFound: calendarsData.calendars?.length || 0
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
    } catch (error) {
      console.error('❌ Error testing token:', error);
      return new Response(JSON.stringify({
        success: false,
        step: 'token_test',
        message: 'Error testing token',
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Helper functions
async function decryptToken(encryptedToken, encryptionKey) {
  const [encryptedData, ivData] = encryptedToken.split(':');
  
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(encryptionKey.substring(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const encrypted = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
  const iv = new Uint8Array(atob(ivData).split('').map(char => char.charCodeAt(0)));
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

async function encryptTokens(tokens, encryptionKey) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(encryptionKey.substring(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedAccessToken = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: accessTokenIv },
    key,
    new TextEncoder().encode(tokens.accessToken)
  );

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
}