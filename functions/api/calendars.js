// Calendars API - List and delete calendars
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (request.method === 'GET') {
      return handleListCalendars(url, env, corsHeaders);
    } else if (request.method === 'DELETE') {
      return handleDeleteCalendars(request, env, corsHeaders);
    } else {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }
  } catch (error) {
    console.error('Calendars API error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleListCalendars(url, env, corsHeaders) {
  const locationId = url.searchParams.get('locationId');
  const accessToken = url.searchParams.get('accessToken');
  
  if (!locationId || !accessToken) {
    return new Response(JSON.stringify({
      error: 'locationId and accessToken are required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  
  try {
    // TODO: Implement actual GHL API call to list calendars
    // For now, return mock data with realistic examples
    const mockCalendars = [
      {
        id: 'cal_001',
        name: 'Beginner Yoga',
        slug: 'beginner-yoga',
        groupId: 'grp_001',
        groupName: 'Yoga Classes',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        customizations: {
          primaryColor: '#FFC300',
          backgroundColor: '#FFFFFF',
          buttonText: 'Book Class'
        }
      },
      {
        id: 'cal_002', 
        name: 'Personal Training',
        slug: 'personal-training',
        groupId: 'grp_002',
        groupName: 'Personal Training',
        isActive: true,
        createdAt: '2024-01-14T14:30:00Z',
        customizations: {
          primaryColor: '#FF6B35',
          backgroundColor: '#FFFFFF', 
          buttonText: 'Schedule Session'
        }
      },
      {
        id: 'cal_003',
        name: 'Make-Up Classes',
        slug: 'makeup-classes',
        groupId: 'grp_003',
        groupName: 'Makeup Classes',
        isActive: false,
        createdAt: '2024-01-13T09:15:00Z',
        customizations: {
          primaryColor: '#FFD60A',
          backgroundColor: '#FFFFFF',
          buttonText: 'Schedule Make-Up'
        }
      }
    ];
    
    return new Response(JSON.stringify({
      calendars: mockCalendars,
      total: mockCalendars.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Error listing calendars:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch calendars',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleDeleteCalendars(request, env, corsHeaders) {
  try {
    const { calendarIds, locationId, accessToken } = await request.json();
    
    if (!calendarIds || !Array.isArray(calendarIds) || !locationId || !accessToken) {
      return new Response(JSON.stringify({
        error: 'calendarIds array, locationId, and accessToken are required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // TODO: Implement actual GHL API calls to delete calendars
    // For now, simulate successful deletion
    const results = {
      success: calendarIds,
      failed: [],
      summary: {
        total: calendarIds.length,
        deleted: calendarIds.length,
        failed: 0
      }
    };
    
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
