// Debug Token API - Test token decryption and GHL API call
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
    
    console.log('DEBUG: Testing token for location:', locationId);
    
    // Get token from database
    const result = await env.DB.prepare(`
      SELECT access_token, refresh_token, expires_at, scope
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId).first();
    
    if (!result) {
      return new Response(JSON.stringify({
        error: 'No token found',
        locationId: locationId,
        debug: 'Token not found in database'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const isExpired = result.expires_at <= now;
    
    console.log('DEBUG: Token found, expires:', result.expires_at, 'now:', now, 'expired:', isExpired);
    
    if (isExpired) {
      return new Response(JSON.stringify({
        error: 'Token expired',
        locationId: locationId,
        expiresAt: result.expires_at,
        currentTime: now,
        debug: 'Token is expired'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Try to decrypt token
    let accessToken;
    try {
      accessToken = await decryptToken(result.access_token, env.ENCRYPTION_KEY);
      console.log('DEBUG: Token decrypted successfully, length:', accessToken.length);
    } catch (decryptError) {
      console.error('DEBUG: Token decryption failed:', decryptError);
      return new Response(JSON.stringify({
        error: 'Token decryption failed',
        locationId: locationId,
        debug: decryptError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Test GHL API call
    try {
      const ghlResponse = await fetch(`https://services.leadconnectorhq.com/calendars?locationId=${locationId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('DEBUG: GHL API response status:', ghlResponse.status);
      
      if (!ghlResponse.ok) {
        const errorText = await ghlResponse.text();
        console.error('DEBUG: GHL API error:', errorText);
        return new Response(JSON.stringify({
          error: 'GHL API call failed',
          locationId: locationId,
          status: ghlResponse.status,
          debug: errorText
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      const ghlData = await ghlResponse.json();
      console.log('DEBUG: GHL API success, calendars count:', ghlData.calendars?.length || 0);
      
      return new Response(JSON.stringify({
        success: true,
        locationId: locationId,
        calendarsCount: ghlData.calendars?.length || 0,
        calendars: ghlData.calendars?.slice(0, 3) || [], // First 3 for debugging
        debug: 'All checks passed'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
    } catch (apiError) {
      console.error('DEBUG: API call error:', apiError);
      return new Response(JSON.stringify({
        error: 'API call failed',
        locationId: locationId,
        debug: apiError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
  } catch (error) {
    console.error('DEBUG: General error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      debug: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Decrypt token using Web Crypto API
async function decryptToken(encryptedToken, encryptionKey) {
  try {
    const [encryptedData, ivData] = encryptedToken.split(':');
    
    if (!encryptedData || !ivData) {
      throw new Error('Invalid encrypted token format');
    }
    
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
    throw new Error(`Failed to decrypt token: ${error.message}`);
  }
}
