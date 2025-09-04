// Locations API - List stored locations
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
  
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }
  
  try {
    // Get all locations from the database
    const result = await env.DB.prepare(`
      SELECT id, name, time_zone, is_enabled 
      FROM locations 
      WHERE is_enabled = 1
      ORDER BY name
    `).all();
    
    const locations = result.results || [];
    
    return new Response(JSON.stringify({
      success: true,
      locations: locations
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Locations API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
