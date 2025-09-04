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
    // Get the most recent location with a valid token
    const result = await env.DB.prepare(`
      SELECT l.id, l.name, l.time_zone, t.expires_at
      FROM locations l
      JOIN tokens t ON l.id = t.location_id
      WHERE l.is_enabled = 1 AND t.expires_at > ?
      ORDER BY t.expires_at DESC
      LIMIT 1
    `).bind(Math.floor(Date.now() / 1000)).first();
    
    if (!result) {
      return new Response(JSON.stringify({
        error: 'No valid location found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    return new Response(JSON.stringify({
      locationId: result.id,
      locationName: result.name,
      timeZone: result.time_zone
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
