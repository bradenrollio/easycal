export async function onRequest(context) {
  const { request } = context;
  
  try {
    const url = new URL(request.url);
    console.log('Auth install called with URL:', request.url);
    console.log('Method:', request.method);
    
    // Get install type from query params
    const installType = url.searchParams.get('type') || 'location';
    
    // Generate state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Build scopes - Include all necessary scopes for calendar and location operations
    const scopes = [
      'calendars.readonly',
      'calendars.write',
      'calendars/groups.write',
      'calendars/groups.readonly',
      'calendars/events.readonly',
      'calendars/events.write',
      'locations.readonly',
      'locations.write',
      'locations/customFields.readonly',
      'locations/customFields.write'
    ];

    if (installType === 'agency') {
      scopes.push('oauth.readonly', 'oauth.write');
    }

    // Use the correct GoHighLevel marketplace authorization URL from official docs
    const baseUrl = 'https://marketplace.gohighlevel.com/oauth/chooselocation';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: '68b96169e165955a7edc20b3-mf58ywbo',
      redirect_uri: 'https://easycal.enrollio.ai/auth/callback',
      scope: scopes.join(' '),
      state: state,
    });

    const authUrl = `${baseUrl}?${params.toString()}`;
    console.log('Generated auth URL:', authUrl);
    
    // Return redirect response
    return Response.redirect(authUrl, 302);
    
  } catch (error) {
    console.error('Auth install error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      status: 'error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}