// Calendar Defaults API - GET and POST
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
      return handleGetDefaults(url, env, corsHeaders);
    } else if (request.method === 'POST') {
      return handlePostDefaults(request, env, corsHeaders);
    } else {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }
  } catch (error) {
    console.error('Defaults API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleGetDefaults(url, env, corsHeaders) {
  const locationId = url.searchParams.get('locationId');
  
  if (!locationId) {
    return new Response(JSON.stringify({ 
      error: 'locationId parameter is required' 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  // Get defaults from KV
  const kvKey = `location:${locationId}:defaults`;
  const defaultsStr = await env.EASYCAL_SESSIONS.get(kvKey);
  
  if (!defaultsStr) {
    // Return default calendar defaults
    const defaultDefaults = {
      locationId,
      defaultSlotDurationMinutes: 30,
      minSchedulingNoticeDays: 1,
      bookingWindowDays: 30,
      spotsPerBooking: 1,
      updatedAt: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(defaultDefaults), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  const defaults = JSON.parse(defaultsStr);
  return new Response(JSON.stringify(defaults), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function handlePostDefaults(request, env, corsHeaders) {
  const defaults = await request.json();
  
  // Validate required fields
  const errors = validateCalendarDefaults(defaults);
  
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
  defaults.updatedAt = new Date().toISOString();
  
  // Store in KV
  const kvKey = `location:${defaults.locationId}:defaults`;
  await env.EASYCAL_SESSIONS.put(kvKey, JSON.stringify(defaults));
  
  return new Response(JSON.stringify(defaults), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

function validateCalendarDefaults(defaults) {
  const errors = [];
  
  if (!defaults.locationId) {
    errors.push('Location ID is required');
  }
  
  if (!defaults.defaultSlotDurationMinutes || defaults.defaultSlotDurationMinutes < 1) {
    errors.push('Default slot duration must be a positive number');
  }
  
  if (!defaults.minSchedulingNoticeDays || defaults.minSchedulingNoticeDays < 0) {
    errors.push('Minimum scheduling notice must be 0 or greater');
  }
  
  if (!defaults.bookingWindowDays || defaults.bookingWindowDays < 1) {
    errors.push('Booking window must be at least 1 day');
  }
  
  if (!defaults.spotsPerBooking || defaults.spotsPerBooking < 1) {
    errors.push('Spots per booking must be at least 1');
  }
  
  if (defaults.defaultTimezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: defaults.defaultTimezone });
    } catch {
      errors.push('Invalid timezone format');
    }
  }
  
  return errors;
}
