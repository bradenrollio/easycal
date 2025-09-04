// Brand Config API - GET and POST
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (request.method === 'GET') {
      return handleGetBrandConfig(url, env, corsHeaders);
    } else if (request.method === 'POST') {
      return handlePostBrandConfig(request, env, corsHeaders);
    } else {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }
  } catch (error) {
    console.error('Brand Config API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleGetBrandConfig(url, env, corsHeaders) {
  const locationId = url.searchParams.get('locationId');
  
  if (!locationId) {
    return new Response(JSON.stringify({ 
      error: 'locationId parameter is required' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Get brand config from KV
  const kvKey = `brand_config:${locationId}`;
  const configStr = await env.EASYCAL_SESSIONS.get(kvKey);
  
  if (!configStr) {
    // Return default brand config
    const defaultConfig = {
      locationId,
      primaryColorHex: '#FFC300',
      backgroundColorHex: '#FFFFFF',
      defaultButtonText: 'Book Now',
      timezone: 'America/New_York',
      updatedAt: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(defaultConfig), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const config = JSON.parse(configStr);
  return new Response(JSON.stringify(config), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handlePostBrandConfig(request, env, corsHeaders) {
  const config = await request.json();
  
  // Validate required fields
  const errors = validateBrandConfig(config);
  
  if (errors.length > 0) {
    return new Response(JSON.stringify({ 
      error: 'Validation failed',
      errors 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Add timestamp
  config.updatedAt = new Date().toISOString();
  
  // Store in KV
  const kvKey = `brand_config:${config.locationId}`;
  await env.EASYCAL_SESSIONS.put(kvKey, JSON.stringify(config));
  
  return new Response(JSON.stringify(config), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

function validateBrandConfig(config) {
  const errors = [];
  
  if (!config.locationId) {
    errors.push('Location ID is required');
  }
  
  if (!config.primaryColorHex || !/^#[0-9a-fA-F]{6}$/.test(config.primaryColorHex)) {
    errors.push('Primary color must be a valid hex color (#RRGGBB)');
  }
  
  if (!config.backgroundColorHex || !/^#[0-9a-fA-F]{6}$/.test(config.backgroundColorHex)) {
    errors.push('Background color must be a valid hex color (#RRGGBB)');
  }
  
  if (!config.defaultButtonText || config.defaultButtonText.length < 3 || config.defaultButtonText.length > 30) {
    errors.push('Default button text must be 3-30 characters');
  }
  
  if (config.timezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: config.timezone });
    } catch {
      errors.push('Invalid timezone format');
    }
  }
  
  return errors;
}
