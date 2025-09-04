// Calendar API - Create, list, and manage calendars
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    const tokenData = await getLocationToken(locationId, env);
    
    if (!tokenData) {
      return new Response(JSON.stringify({ 
        error: 'No access token found for location' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (request.method === 'GET') {
      return handleListCalendars(tokenData.accessToken, locationId, corsHeaders);
    } else if (request.method === 'POST') {
      return handleCreateCalendar(request, tokenData.accessToken, locationId, corsHeaders);
    } else if (request.method === 'DELETE') {
      return handleDeleteCalendars(request, tokenData.accessToken, locationId, corsHeaders);
    } else {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Get access token for a location
async function getLocationToken(locationId, env) {
  try {
    console.log('Looking for token for location:', locationId);
    
    // Get token from database
    const result = await env.DB.prepare(`
      SELECT access_token, refresh_token, expires_at 
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId).first();
    
    console.log('Token query result:', result ? 'found' : 'not found');
    
    if (!result) {
      console.log('No token found for location:', locationId);
      return null;
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    console.log('Token expires at:', result.expires_at, 'Current time:', now);
    
    if (result.expires_at <= now) {
      console.warn('Token expired for location:', locationId);
      return null;
    }
    
    // Decrypt token
    console.log('Attempting to decrypt token...');
    const accessToken = await decryptToken(result.access_token, env.ENCRYPTION_KEY);
    console.log('Token decrypted successfully');
    
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

// Handle listing calendars
async function handleListCalendars(accessToken, locationId, corsHeaders) {
  try {
    console.log('Making GHL API call to list calendars for location:', locationId);
    console.log('Using access token (first 10 chars):', accessToken.substring(0, 10));
    
    // Use the correct GHL API endpoint format from documentation
    const endpoint = `https://services.leadconnectorhq.com/calendars/?locationId=${locationId}`;
    console.log('Using GHL API endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('GHL API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL API error details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch calendars from GHL API',
        status: response.status,
        details: errorText,
        endpoint: endpoint
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const data = await response.json();
    console.log('GHL API success! Calendars found:', data.calendars?.length || 0);
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error listing calendars:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to list calendars',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Handle creating calendar
async function handleCreateCalendar(request, accessToken, locationId, corsHeaders) {
  try {
    const calendarData = await request.json();
    
    // Validate required fields
    if (!calendarData.name || !calendarData.slug) {
      return new Response(JSON.stringify({ 
        error: 'Calendar name and slug are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Add locationId to the data
    const createData = {
      ...calendarData,
      locationId: locationId
    };
    
    const response = await fetch('https://services.leadconnectorhq.com/calendars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL API error:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Failed to create calendar in GHL API',
        details: errorText
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error creating calendar:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create calendar',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Handle deleting calendars
async function handleDeleteCalendars(request, accessToken, locationId, corsHeaders) {
  try {
    const { calendarIds } = await request.json();
    
    if (!calendarIds || !Array.isArray(calendarIds)) {
      return new Response(JSON.stringify({ 
        error: 'calendarIds array is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const results = { success: [], failed: [] };
    
    // Delete each calendar
    for (const calendarId of calendarIds) {
      try {
        const response = await fetch(`https://services.leadconnectorhq.com/calendars/${calendarId}?locationId=${locationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          results.success.push(calendarId);
        } else {
          const errorText = await response.text();
          results.failed.push({
            id: calendarId,
            error: `HTTP ${response.status}: ${errorText}`
          });
        }
      } catch (error) {
        results.failed.push({
          id: calendarId,
          error: error.message
        });
      }
    }
    
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Error deleting calendars:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete calendars',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}