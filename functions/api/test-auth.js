// Test Auth API - Simple test to verify token works
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
    const locationId = url.searchParams.get('locationId') || 'EnUqtThIwW8pdTLOvuO7';
    
    // Get token
    const tokenData = await getLocationToken(locationId, env);
    
    if (!tokenData) {
      return new Response(JSON.stringify({
        error: 'No token found',
        locationId: locationId
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Test with a simple GHL API endpoint that should work - try locations first
    const testEndpoints = [
      {
        name: 'Get Location Info',
        url: `https://services.leadconnectorhq.com/locations/${locationId}`,
        method: 'GET'
      },
      {
        name: 'List Calendars',
        url: `https://services.leadconnectorhq.com/calendars/?locationId=${locationId}`,
        method: 'GET'
      },
      {
        name: 'List Calendars with showDrafted',
        url: `https://services.leadconnectorhq.com/calendars/?locationId=${locationId}&showDrafted=true`,
        method: 'GET'
      }
    ];

    const results = [];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
        
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Authorization': `Bearer ${tokenData.accessToken}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }

        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: response.status,
          success: response.ok,
          data: response.ok ? responseData : null,
          error: !response.ok ? responseData : null
        });

        console.log(`${endpoint.name} result:`, response.status, response.ok ? 'SUCCESS' : 'FAILED');
        
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: 'ERROR',
          success: false,
          error: error.message
        });
        console.error(`${endpoint.name} error:`, error);
      }
    }

    return new Response(JSON.stringify({
      locationId: locationId,
      tokenFound: true,
      tokenExpiry: tokenData.expiresAt,
      currentTime: Math.floor(Date.now() / 1000),
      results: results
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Test auth error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Get access token for a location (duplicate function for testing)
async function getLocationToken(locationId, env) {
  try {
    const result = await env.DB.prepare(`
      SELECT access_token, refresh_token, expires_at 
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId).first();
    
    if (!result) {
      return null;
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (result.expires_at <= now) {
      console.warn('Token expired for location:', locationId);
      return null;
    }
    
    const accessToken = await decryptToken(result.access_token, env.ENCRYPTION_KEY);
    
    return {
      accessToken,
      refreshToken: result.refresh_token,
      expiresAt: result.expires_at
    };
  } catch (error) {
    console.error('Error getting location token:', error);
    return null;
  }
}

// Decrypt token
async function decryptToken(encryptedToken, encryptionKey) {
  try {
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
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt token');
  }
}
