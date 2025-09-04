// Import Calendars API - Process CSV and create GHL calendars
export async function onRequest(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }
  
  try {
    const { locationId, csvRows, accessToken } = await request.json();
    
    if (!locationId || !csvRows || !accessToken) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: locationId, csvRows, accessToken'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Get brand config
    const brandConfigKey = `brand_config:${locationId}`;
    const brandConfigStr = await env.EASYCAL_SESSIONS.get(brandConfigKey);
    
    const brandConfig = brandConfigStr ? JSON.parse(brandConfigStr) : {
      locationId,
      primaryColorHex: '#FFC300',
      backgroundColorHex: '#FFFFFF',
      defaultButtonText: 'Book Now',
      timezone: 'America/New_York'
    };
    
    // Process each row
    const results = [];
    const groupCache = new Map(); // Cache created groups
    
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      
      try {
        // Validate row
        const validationErrors = validateCSVRow(row, i);
        if (validationErrors.some(e => e.severity === 'error')) {
          results.push({
            success: false,
            slug: row.custom_url || slugify(row.calendar_name),
            name: row.calendar_name,
            error: validationErrors.filter(e => e.severity === 'error').map(e => e.message).join('; '),
            warnings: validationErrors.filter(e => e.severity === 'warning').map(e => e.message)
          });
          continue;
        }
        
        // Ensure calendar group exists
        let groupId;
        if (row.calendar_group) {
          if (groupCache.has(row.calendar_group)) {
            groupId = groupCache.get(row.calendar_group);
          } else {
            groupId = await ensureGroup(row.calendar_group, locationId, accessToken);
            groupCache.set(row.calendar_group, groupId);
          }
        }
        
        // Build calendar payload
        const payload = buildCalendarPayload(row, brandConfig, groupId);
        
        // Create or update calendar
        const result = await createOrUpdateCalendar(payload, locationId, accessToken);
        
        results.push({
          success: true,
          calendarId: result.id,
          slug: payload.slug,
          name: payload.name,
          isUpdate: result.isUpdate,
          warnings: validationErrors.filter(e => e.severity === 'warning').map(e => e.message)
        });
        
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        results.push({
          success: false,
          slug: row.custom_url || slugify(row.calendar_name),
          name: row.calendar_name,
          error: error.message
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        updated: results.filter(r => r.success && r.isUpdate).length,
        created: results.filter(r => r.success && !r.isUpdate).length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
    
  } catch (error) {
    console.error('Import calendars error:', error);
    return new Response(JSON.stringify({
      error: 'Import failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Helper functions (simplified versions)
function validateCSVRow(row, rowIndex) {
  const errors = [];
  
  if (!row.calendar_type || row.calendar_type.toLowerCase() !== 'event') {
    errors.push({ row: rowIndex, field: 'calendar_type', message: 'Calendar type must be "event"', severity: 'error' });
  }
  
  if (!row.calendar_name?.trim()) {
    errors.push({ row: rowIndex, field: 'calendar_name', message: 'Calendar name is required', severity: 'error' });
  }
  
  return errors;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function applyBranding(row, brandConfig) {
  const primaryColor = row.primary_color_hex || brandConfig.primaryColorHex;
  const backgroundColor = row.background_color_hex || brandConfig.backgroundColorHex;
  
  let buttonText = row.button_text;
  if (!buttonText) {
    if (row.calendar_purpose === 'makeup') {
      buttonText = 'Schedule Make-Up';
    } else {
      buttonText = brandConfig.defaultButtonText;
    }
  }
  
  return { primaryColor, backgroundColor, buttonText };
}

function buildCalendarPayload(row, brandConfig, groupId) {
  const branding = applyBranding(row, brandConfig);
  const slug = row.custom_url || slugify(row.calendar_name);
  
  // Parse availability (simplified)
  let availability;
  if (row.schedule_blocks) {
    // Parse schedule blocks
    const blocks = parseScheduleBlocks(row.schedule_blocks);
    availability = {
      weekly: blocks.map(block => ({
        day: block.day.substring(0, 3),
        start: block.start,
        end: block.end
      })),
      slotInterval: parseInt(row.slot_interval)
    };
  } else {
    // Single day/time
    const timeRange = row.time_of_week.split('-');
    availability = {
      weekly: [{
        day: row.day_of_week.substring(0, 3),
        start: timeRange[0],
        end: timeRange[1] || addMinutesToTime(timeRange[0], parseInt(row.class_duration))
      }],
      slotInterval: parseInt(row.slot_interval)
    };
  }
  
  return {
    locationId: brandConfig.locationId,
    name: row.calendar_name,
    description: row.class_description,
    widgetType: 'default',
    customizations: branding,
    duration: parseInt(row.class_duration),
    timeZone: row.timezone || brandConfig.timezone || 'America/New_York',
    availability,
    minSchedulingNotice: parseInt(row.min_scheduling_notice),
    maxBookingsPerDay: parseInt(row.max_bookings_per_day),
    groupId,
    slug
  };
}

function parseScheduleBlocks(scheduleStr) {
  const blocks = [];
  if (!scheduleStr) return blocks;
  
  const segments = scheduleStr.split(';').map(s => s.trim());
  
  for (const segment of segments) {
    const match = segment.match(/^(\w+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    if (match) {
      const [, day, start, end] = match;
      blocks.push({ day: normalizeDay(day), start, end });
    }
  }
  
  return blocks;
}

function normalizeDay(dayToken) {
  const dayMap = {
    'mon': 'Monday', 'monday': 'Monday',
    'tue': 'Tuesday', 'tuesday': 'Tuesday',
    'wed': 'Wednesday', 'wednesday': 'Wednesday',
    'thu': 'Thursday', 'thursday': 'Thursday',
    'fri': 'Friday', 'friday': 'Friday',
    'sat': 'Saturday', 'saturday': 'Saturday',
    'sun': 'Sunday', 'sunday': 'Sunday'
  };
  
  return dayMap[dayToken.toLowerCase()] || dayToken;
}

function addMinutesToTime(timeStr, minutes) {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

// Placeholder functions (would need actual GHL API calls)
async function ensureGroup(groupName, locationId, accessToken) {
  // TODO: Implement actual GHL API call to create/find group
  return `group_${groupName.toLowerCase().replace(/\s+/g, '_')}`;
}

async function createOrUpdateCalendar(payload, locationId, accessToken) {
  // TODO: Implement actual GHL API call to create/update calendar
  return { id: `cal_${Date.now()}`, isUpdate: false };
}
