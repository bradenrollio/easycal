// Detect Location API - Find the correct location ID for the current user
export async function onRequest(context) {
  const { request, env } = context;
  
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
    // First, try to get the most recent valid token (including agency tokens)
    const tokenResult = await env.DB.prepare(`
      SELECT t.location_id, t.user_type, t.company_id, t.expires_at,
             l.name as location_name, l.time_zone
      FROM tokens t
      LEFT JOIN locations l ON l.id = t.location_id
      WHERE t.expires_at > ?
      ORDER BY 
        CASE WHEN t.user_type = 'Location' THEN 0 ELSE 1 END,
        CASE WHEN t.location_id NOT LIKE 'temp_%' AND t.location_id NOT LIKE 'agency_%' THEN 0 ELSE 1 END,
        t.expires_at DESC
      LIMIT 1
    `).bind(Math.floor(Date.now() / 1000)).first();
    
    if (!tokenResult) {
      return new Response(JSON.stringify({
        error: 'No valid tokens found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Handle agency-level installations
    if (tokenResult.user_type === 'Company') {
      return new Response(JSON.stringify({
        locationId: tokenResult.location_id,
        companyId: tokenResult.company_id,
        userType: 'Company',
        isAgencyInstall: true,
        locationName: 'Agency Installation',
        timeZone: 'America/New_York'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Handle location-level installations
    return new Response(JSON.stringify({
      locationId: tokenResult.location_id,
      companyId: tokenResult.company_id,
      userType: 'Location',
      isAgencyInstall: false,
      locationName: tokenResult.location_name || 'Location Installation',
      timeZone: tokenResult.time_zone || 'America/New_York'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Detect location error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
