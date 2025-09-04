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
    
    // Get access token for this location
    const token = await getLocationToken(locationId, env);
    
    if (!token) {
      return new Response(JSON.stringify({ 
        error: 'No access token found for location' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Fetch location details from GHL API
    const ghlResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    if (!ghlResponse.ok) {
      console.error('GHL API error:', await ghlResponse.text());
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch location from GHL API' 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const locationData = await ghlResponse.json();
    
    return new Response(JSON.stringify({ 
      timeZone: locationData.location?.timezone || 'America/New_York'
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
    // Try to get token from KV storage first
    const tokenKey = `token:${locationId}`;
    const tokenStr = await env.EASYCAL_SESSIONS.get(tokenKey);
    
    if (tokenStr) {
      const tokenData = JSON.parse(tokenStr);
      
      // Check if token is expired
      if (new Date(tokenData.expiresAt) > new Date()) {
        return tokenData.accessToken;
      }
    }
    
    // TODO: Implement token refresh logic here
    // For now, return null if no valid token found
    return null;
    
  } catch (error) {
    console.error('Error getting location token:', error);
    return null;
  }
}
