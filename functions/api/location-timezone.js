// Location Timezone API - GET location timezone from GHL
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }
  
  try {
    const locationId = url.searchParams.get('locationId');
    
    if (!locationId) {
      return new Response(JSON.stringify({ 
        error: 'locationId parameter is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // First try to get timezone from our database
    const locationResult = await env.DB.prepare(`
      SELECT time_zone FROM locations WHERE id = ?
    `).bind(locationId).first();
    
    if (locationResult) {
      return new Response(JSON.stringify({ 
        timeZone: locationResult.time_zone 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // If not in database, try to get from GHL API
    const tokenData = await getLocationToken(locationId, env);
    
    if (!tokenData) {
      // Return default timezone if no token available
      return new Response(JSON.stringify({ 
        timeZone: 'America/New_York'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Fetch location details from GHL API
    const ghlResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    if (!ghlResponse.ok) {
      console.error('GHL API error:', await ghlResponse.text());
      return new Response(JSON.stringify({ 
        timeZone: 'America/New_York' // Fallback
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const locationData = await ghlResponse.json();
    const timeZone = locationData.location?.timezone || 'America/New_York';
    
    // Update our database with the timezone
    try {
      await env.DB.prepare(`
        UPDATE locations SET time_zone = ? WHERE id = ?
      `).bind(timeZone, locationId).run();
    } catch (error) {
      console.warn('Failed to update location timezone in database:', error);
    }
    
    return new Response(JSON.stringify({ 
      timeZone: timeZone
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Location timezone API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function getLocationToken(locationId, env) {
  try {
    // Get token from database
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
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (result.expires_at <= now) {
      // TODO: Implement token refresh
      console.warn('Token expired for location:', locationId);
      return null;
    }
    
    // Decrypt token
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

// Decrypt token using Web Crypto API
async function decryptToken(encryptedToken, encryptionKey) {
  try {
    const [encryptedData, ivData] = encryptedToken.split(':');
    
    // Import the encryption key
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Convert from base64
    const encrypted = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivData).split('').map(char => char.charCodeAt(0)));
    
    // Decrypt
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
