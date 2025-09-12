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
      console.log('No token found for location:', locationId);
      return new Response(JSON.stringify({ 
        error: 'Not authenticated',
        message: 'No access token found for this location. Please connect to Enrollio first.',
        locationId: locationId
      }), {
        status: 401,
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
    
    // First, try to get a direct location token
    let result = await env.DB.prepare(`
      SELECT id, access_token, refresh_token, expires_at, user_type, company_id
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId).first();
    
    // If no direct location token found, check for agency token
    if (!result && (locationId === 'temp_location' || locationId?.startsWith('temp_') || locationId?.startsWith('agency_'))) {
      console.log('No direct location token found, checking for agency token...');
      console.log('Looking for agency token with user_type = Company and location_id IS NULL');
      
      result = await env.DB.prepare(`
        SELECT id, access_token, refresh_token, expires_at, user_type, company_id
        FROM tokens 
        WHERE user_type = 'Company' AND location_id IS NULL
        ORDER BY expires_at DESC 
        LIMIT 1
      `).first();
      
      console.log('Agency token query result:', result ? 'found' : 'not found');
      
      if (result) {
        console.log('Found agency token, will use it to get location-specific access');
      }
    }
    
    console.log('Token query result:', result ? 'found' : 'not found');
    
    if (!result) {
      console.log('No token found for location:', locationId);
      return null;
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    console.log('Token expires at:', result.expires_at, 'Current time:', now);
    
    if (result.expires_at <= now) {
      console.warn('Token expired for location:', locationId, '- attempting to refresh...');
      
      // Decrypt refresh token
      const refreshToken = await decryptToken(result.refresh_token, env.ENCRYPTION_KEY);
      
      // Attempt to refresh the token
      const newTokenData = await refreshAccessToken(refreshToken, env);
      
      if (!newTokenData) {
        console.error('Failed to refresh token for location:', locationId);
        return null;
      }
      
      // Encrypt and update the token in the database
      const encryptedTokens = await encryptTokens({
        accessToken: newTokenData.access_token,
        refreshToken: newTokenData.refresh_token || refreshToken // Use new refresh token if provided, otherwise keep the old one
      }, env.ENCRYPTION_KEY);
      
      // Update the token in the database
      await env.DB.prepare(`
        UPDATE tokens 
        SET access_token = ?, 
            refresh_token = ?,
            expires_at = ?
        WHERE id = ?
      `).bind(
        encryptedTokens.accessToken,
        encryptedTokens.refreshToken,
        Math.floor((Date.now() + (newTokenData.expires_in * 1000)) / 1000),
        result.id
      ).run();
      
      console.log('Token refreshed successfully for location:', locationId);
      
      return {
        accessToken: newTokenData.access_token,
        refreshToken: newTokenData.refresh_token || refreshToken,
        expiresAt: Math.floor((Date.now() + (newTokenData.expires_in * 1000)) / 1000)
      };
    }
    
    // Decrypt token
    console.log('Attempting to decrypt token...');
    const accessToken = await decryptToken(result.access_token, env.ENCRYPTION_KEY);
    console.log('Token decrypted successfully');
    
    // If this is an agency token, we need to get a location-specific token
    if (result.user_type === 'Company' && result.company_id) {
      console.log('Agency token detected, getting location-specific token...');
      try {
        // For agency installations, use the actual location ID passed in
        // Don't hardcode - each subaccount has its own location ID
        const actualLocationId = locationId === 'temp_location' || locationId?.startsWith('temp_') || locationId?.startsWith('agency_') 
          ? null // Return null to indicate we need a real location ID
          : locationId;
        
        if (!actualLocationId) {
          console.error('Cannot use agency token without a valid location ID');
          return null;
        }
        
        return await getLocationTokenDirect(accessToken, result.company_id, actualLocationId);
      } catch (error) {
        console.error('Error getting location token:', error);
        return null;
      }
    }
    
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

// Refresh an expired access token using the refresh token
async function refreshAccessToken(refreshToken, env) {
  try {
    console.log('Refreshing access token...');
    
    // Use the correct OAuth token endpoint
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.HL_CLIENT_ID,
        client_secret: env.HL_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        user_type: 'Location'
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token refresh failed:', tokenResponse.status, errorText);
      return null;
    }

    const tokenData = await tokenResponse.json();
    console.log('Token refreshed successfully');
    
    return tokenData;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Encrypt tokens for storage
async function encryptTokens(tokens, encryptionKey) {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Encrypt access token
    const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedAccessToken = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: accessTokenIv },
      key,
      new TextEncoder().encode(tokens.accessToken)
    );

    // Encrypt refresh token
    const refreshTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedRefreshToken = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: refreshTokenIv },
      key,
      new TextEncoder().encode(tokens.refreshToken)
    );

    return {
      accessToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedAccessToken)))}:${btoa(String.fromCharCode(...accessTokenIv))}`,
      refreshToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedRefreshToken)))}:${btoa(String.fromCharCode(...refreshTokenIv))}`
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt tokens');
  }
}

// Direct function to get location token from agency token
async function getLocationTokenDirect(agencyToken, companyId, locationId) {
  try {
    console.log('Getting location token directly for:', { companyId, locationId });
    
    // Use Enrollio's whitelabel API for location token
    const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agencyToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        companyId: companyId,
        locationId: locationId
      }).toString()
    });
    
    console.log('Location token API response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get location token:', tokenResponse.status, errorText);
      return null;
    }
    
    const tokenData = await tokenResponse.json();
    console.log('Successfully obtained location token for location:', locationId);
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 86400)
    };
  } catch (error) {
    console.error('Error getting location token directly:', error);
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
    // Use the actual location ID passed in - don't override it
    const actualLocationId = locationId;
    
    console.log('Making GHL API call to list calendars for location:', actualLocationId);
    console.log('Original locationId:', locationId, 'Actual locationId:', actualLocationId);
    console.log('Using access token (first 10 chars):', accessToken.substring(0, 10));
    
    // Use the correct API endpoint for calendars
    // Include showDrafted=true to get all calendars (active + inactive)
    const endpoint = `https://services.leadconnectorhq.com/calendars/?locationId=${actualLocationId}&showDrafted=true`;
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
    
    // Use the correct API endpoint
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
    
    if (calendarIds.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No calendar IDs provided for deletion' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Validate all IDs are strings and non-empty
    const validCalendarIds = calendarIds.filter(id => 
      typeof id === 'string' && id.trim().length > 0
    );
    
    if (validCalendarIds.length !== calendarIds.length) {
      console.warn(`Filtered out ${calendarIds.length - validCalendarIds.length} invalid calendar IDs`);
    }
    
    if (validCalendarIds.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'All provided calendar IDs were invalid' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    console.log(`Received request to delete ${validCalendarIds.length} valid calendars:`, validCalendarIds);
    
    const results = { success: [], failed: [] };
    
    // Delete ONLY the calendars specified in the request
    for (const calendarId of validCalendarIds) {
      try {
        // Use the correct API endpoint with locationId as query parameter
        console.log(`Attempting to delete calendar: ${calendarId} for location: ${locationId}`);
        
        const deleteUrl = `https://services.leadconnectorhq.com/calendars/${calendarId}`;
        console.log('DELETE URL:', deleteUrl);
        
        const response = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`Delete response status for ${calendarId}:`, response.status);
        console.log(`Response headers:`, response.headers);
        
        // Try to read response body (might be empty for successful deletes)
        let responseBody = '';
        try {
          responseBody = await response.text();
          console.log(`Response body for ${calendarId}:`, responseBody || '(empty)');
        } catch (e) {
          console.log(`Could not read response body for ${calendarId}:`, e);
        }
        
        // Check the delete response
        // GoHighLevel API may return various status codes for successful deletion
        // Common successful deletion codes: 200, 204, 404
        // 404 can mean "already deleted" or "doesn't exist"
        // Some APIs return 422 or other codes even when deletion succeeds
        
        console.log(`Delete response for ${calendarId}: status=${response.status}, body='${responseBody}'`);
        
        // First, check if we got an explicit success status
        // Include more possible success codes that APIs might return
        if (response.status === 200 || response.status === 202 || response.status === 204) {
          console.log(`Calendar ${calendarId} deleted successfully (explicit success status ${response.status})`);
          results.success.push(calendarId);
        } 
        // 404 usually means the calendar doesn't exist (may have been already deleted)
        else if (response.status === 404) {
          console.log(`Calendar ${calendarId} not found - treating as successful deletion`);
          results.success.push(calendarId);
        }
        // 422 Unprocessable Entity - might mean already deleted
        else if (response.status === 422) {
          console.log(`Calendar ${calendarId} returned 422 - likely already deleted, verifying...`);
          // Still verify but lean towards success
          const verifyUrl = `https://services.leadconnectorhq.com/calendars/${calendarId}`;
          try {
            const quickCheck = await fetch(verifyUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Version': '2021-07-28'
              }
            });
            if (quickCheck.status === 404) {
              console.log(`Verified: Calendar ${calendarId} deleted (422 then 404)`);
              results.success.push(calendarId);
            } else {
              console.log(`Calendar ${calendarId} still exists after 422 response`);
              results.failed.push({
                id: calendarId,
                error: `Unprocessable entity error`
              });
            }
          } catch (e) {
            // Assume success on 422 if we can't verify
            console.log(`Calendar ${calendarId} returned 422, cannot verify, assuming success`);
            results.success.push(calendarId);
          }
        }
        // For any other status, let's verify by trying to GET the calendar
        else {
          console.log(`Ambiguous delete status for ${calendarId}, verifying...`);
          
          // Small delay to allow for eventual consistency
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            const verifyUrl = `https://services.leadconnectorhq.com/calendars/${calendarId}`;
            const verifyResponse = await fetch(verifyUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Version': '2021-07-28',
                'Accept': 'application/json'
              }
            });
            
            console.log(`Verification GET for ${calendarId} returned status: ${verifyResponse.status}`);
            
            // If we get 404, the calendar was deleted
            if (verifyResponse.status === 404) {
              console.log(`Verified: Calendar ${calendarId} successfully deleted (404 on verification)`);
              results.success.push(calendarId);
            } 
            // If we get 200 and calendar exists, deletion failed
            else if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData && verifyData.id === calendarId) {
                console.log(`Verified: Calendar ${calendarId} still exists - deletion failed`);
                results.failed.push({
                  id: calendarId,
                  error: `Calendar still exists after deletion attempt`
                });
              } else {
                // Ambiguous - treat as success
                console.log(`Ambiguous verification for ${calendarId}, treating as success`);
                results.success.push(calendarId);
              }
            }
            // Any other status on verification - assume deleted
            else {
              console.log(`Calendar ${calendarId} verification returned ${verifyResponse.status}, assuming deleted`);
              results.success.push(calendarId);
            }
          } catch (verifyError) {
            // If we can't verify, assume success if the original delete didn't explicitly fail
            console.log(`Could not verify ${calendarId}, assuming success based on delete response`);
            results.success.push(calendarId);
          }
        }
      } catch (error) {
        console.error(`Exception while deleting calendar ${calendarId}:`, error);
        results.failed.push({
          id: calendarId,
          error: error.message
        });
      }
    }
    
    console.log('Final delete results:', {
      successCount: results.success.length,
      failedCount: results.failed.length,
      success: results.success,
      failed: results.failed
    });
    
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