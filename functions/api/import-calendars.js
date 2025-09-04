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
    const { locationId, csvRows, brandConfig, defaults } = await request.json();
    
    if (!locationId || !csvRows || !Array.isArray(csvRows)) {
      return new Response(JSON.stringify({
        error: 'locationId and csvRows are required'
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

    // Create job record
    const jobId = generateId();
    await env.DB.prepare(`
      INSERT INTO jobs (id, tenant_id, location_id, type, status, total, success_count, error_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      jobId,
      'temp', // We'll update this when we have proper tenant lookup
      locationId,
      'create_calendars',
      'running',
      csvRows.length,
      0,
      0,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000)
    ).run();

    // Process calendars (we'll do this synchronously for now, but could use queues for large batches)
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    const groupCache = new Map(); // Cache created groups

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      
      try {
        // Validate row
        const validationErrors = validateCSVRow(row, i);
        if (validationErrors.some(e => e.severity === 'error')) {
          const errorResult = {
            success: false,
            slug: row.custom_url || slugify(row.calendar_name),
            name: row.calendar_name,
            error: validationErrors.filter(e => e.severity === 'error').map(e => e.message).join('; '),
            warnings: validationErrors.filter(e => e.severity === 'warning').map(e => e.message)
          };
          results.push(errorResult);
          errorCount++;
          continue;
        }
        
        // Ensure calendar group exists
        let groupId;
        if (row.calendar_group) {
          if (groupCache.has(row.calendar_group)) {
            groupId = groupCache.get(row.calendar_group);
          } else {
            groupId = await ensureGroup(row.calendar_group, locationId, tokenData.accessToken);
            groupCache.set(row.calendar_group, groupId);
          }
        }
        
        // Build calendar payload
        const payload = buildCalendarPayload(row, brandConfig, defaults, locationId, groupId);
        
        // Create or update calendar
        const result = await createOrUpdateCalendar(payload, tokenData.accessToken);
        
        const successResult = {
          success: true,
          calendarId: result.id,
          slug: payload.slug,
          name: payload.name,
          isUpdate: result.isUpdate,
          warnings: validationErrors.filter(e => e.severity === 'warning').map(e => e.message)
        };
        results.push(successResult);
        successCount++;
        
        // Store job item result
        await env.DB.prepare(`
          INSERT INTO job_items (id, job_id, input, result, status, error_message)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(),
          jobId,
          JSON.stringify(row),
          JSON.stringify(successResult),
          'success',
          null
        ).run();
        
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        const errorResult = {
          success: false,
          slug: row.custom_url || slugify(row.calendar_name),
          name: row.calendar_name,
          error: error.message
        };
        results.push(errorResult);
        errorCount++;
        
        // Store job item error
        await env.DB.prepare(`
          INSERT INTO job_items (id, job_id, input, result, status, error_message)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(),
          jobId,
          JSON.stringify(row),
          JSON.stringify(errorResult),
          'error',
          error.message
        ).run();
      }
    }

    // Update job status
    const finalStatus = errorCount === 0 ? 'success' : (successCount === 0 ? 'error' : 'partial');
    await env.DB.prepare(`
      UPDATE jobs 
      SET status = ?, success_count = ?, error_count = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      finalStatus,
      successCount,
      errorCount,
      Math.floor(Date.now() / 1000),
      jobId
    ).run();

    return new Response(JSON.stringify({
      success: true,
      jobId: jobId,
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

// Helper functions
function validateCSVRow(row, rowIndex) {
  const errors = [];
  
  if (!row.calendar_type || row.calendar_type.toLowerCase() !== 'event') {
    errors.push({ row: rowIndex, field: 'calendar_type', message: 'Calendar type must be "event"', severity: 'error' });
  }
  
  if (!row.calendar_name?.trim()) {
    errors.push({ row: rowIndex, field: 'calendar_name', message: 'Calendar name is required', severity: 'error' });
  }
  
  if (!row.schedule_blocks?.trim()) {
    errors.push({ row: rowIndex, field: 'schedule_blocks', message: 'Schedule blocks are required', severity: 'error' });
  }
  
  const slotInterval = parseInt(row.slot_interval_minutes);
  const classDuration = parseInt(row.class_duration_minutes);
  
  if (isNaN(slotInterval) || slotInterval <= 0) {
    errors.push({ row: rowIndex, field: 'slot_interval_minutes', message: 'Slot interval must be a positive number', severity: 'error' });
  }
  
  if (isNaN(classDuration) || classDuration <= 0) {
    errors.push({ row: rowIndex, field: 'class_duration_minutes', message: 'Class duration must be a positive number', severity: 'error' });
  }
  
  return errors;
}

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function applyBranding(row, brandConfig) {
  const primaryColor = row.primary_color_hex || brandConfig?.primaryColorHex || '#FFC300';
  const backgroundColor = row.background_color_hex || brandConfig?.backgroundColorHex || '#FFFFFF';
  
  let buttonText = row.button_text;
  if (!buttonText) {
    if (row.calendar_purpose === 'makeup') {
      buttonText = 'Schedule Make-Up';
    } else {
      buttonText = brandConfig?.defaultButtonText || 'Book Now';
    }
  }
  
  return { primaryColor, backgroundColor, buttonText };
}

function buildCalendarPayload(row, brandConfig, defaults, locationId, groupId) {
  const branding = applyBranding(row, brandConfig);
  const slug = row.custom_url || slugify(row.calendar_name);
  
  // Parse schedule blocks
  const blocks = parseScheduleBlocks(row.schedule_blocks);
  
  return {
    locationId: locationId,
    name: row.calendar_name,
    description: row.class_description || '',
    slug: slug,
    widgetType: 'default',
    calendarType: 1, // Event calendar
    eventType: 'RoundRobin_OptimizeForAvailability',
    groupId: groupId,
    isActive: true,
    
    customizations: {
      primaryColor: branding.primaryColor,
      backgroundColor: branding.backgroundColor,
      buttonText: branding.buttonText
    },
    
    availabilityTimezone: brandConfig?.defaultTimezone || defaults?.defaultTimezone || 'America/New_York',
    slotDurationMinutes: parseInt(row.slot_interval_minutes) || defaults?.defaultSlotDurationMinutes || 30,
    slotBufferMinutes: 0,
    minSchedulingNoticeMinutes: (parseInt(row.min_scheduling_notice_days) || defaults?.minSchedulingNoticeDays || 1) * 24 * 60,
    maxSchedulingNoticeDays: 365,
    
    maxBookingsPerSlot: 1,
    maxBookingsPerDay: parseInt(row.max_bookings_per_day) || 10,
    
    availabilities: blocks.map(block => ({
      day: getDayNumber(block.day),
      hours: [{
        openTime: block.start,
        closeTime: block.end
      }]
    }))
  };
}

function parseScheduleBlocks(scheduleStr) {
  const blocks = [];
  if (!scheduleStr?.trim()) return blocks;
  
  const segments = scheduleStr.split(';').map(s => s.trim());
  
  for (const segment of segments) {
    if (!segment) continue;
    
    const match = segment.match(/^(\w+)\s+(.+)$/);
    if (!match) continue;
    
    const [, dayStr, timeRange] = match;
    const day = normalizeDay(dayStr);
    
    if (!day) continue;
    
    const timeMatch = timeRange.match(/^(.+?)-(.+?)$/);
    if (!timeMatch) continue;
    
    const [, startTime, endTime] = timeMatch;
    const start = to24h(startTime.trim());
    const end = to24h(endTime.trim());
    
    if (!start || !end) continue;
    
    blocks.push({ day, start, end });
  }
  
  return blocks;
}

function normalizeDay(token) {
  const normalized = token.toLowerCase().trim();
  
  const dayMap = {
    'mon': 'Mon', 'monday': 'Mon',
    'tue': 'Tue', 'tuesday': 'Tue', 'tues': 'Tue',
    'wed': 'Wed', 'wednesday': 'Wed',
    'thu': 'Thu', 'thursday': 'Thu', 'thur': 'Thu', 'thurs': 'Thu',
    'fri': 'Fri', 'friday': 'Fri',
    'sat': 'Sat', 'saturday': 'Sat',
    'sun': 'Sun', 'sunday': 'Sun'
  };

  return dayMap[normalized] || null;
}

function to24h(time) {
  const trimmed = time.trim();
  
  // Check if it's already in 24-hour format
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hours, minutes] = trimmed.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }
  
  // Parse 12-hour format
  const match12h = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12h) {
    let hours = parseInt(match12h[1], 10);
    const minutes = parseInt(match12h[2] || '0', 10);
    const ampm = match12h[3].toUpperCase();
    
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      return null;
    }
    
    if (ampm === 'AM' && hours === 12) {
      hours = 0;
    } else if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return null;
}

function getDayNumber(dayName) {
  const dayMap = {
    'Sun': 0, 'Sunday': 0,
    'Mon': 1, 'Monday': 1,
    'Tue': 2, 'Tuesday': 2,
    'Wed': 3, 'Wednesday': 3,
    'Thu': 4, 'Thursday': 4,
    'Fri': 5, 'Friday': 5,
    'Sat': 6, 'Saturday': 6
  };
  
  return dayMap[dayName] ?? 1;
}

function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// GHL API functions
async function ensureGroup(groupName, locationId, accessToken) {
  try {
    // First, try to find existing group
    const groupsResponse = await fetch(`https://services.leadconnectorhq.com/calendars/groups?locationId=${locationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    if (groupsResponse.ok) {
      const groupsData = await groupsResponse.json();
      const existingGroup = groupsData.groups?.find(g => g.name.toLowerCase() === groupName.toLowerCase());
      
      if (existingGroup) {
        return existingGroup.id;
      }
    }

    // Create new group
    const groupData = {
      locationId: locationId,
      name: groupName,
      slug: slugify(groupName),
      isActive: true
    };

    const createResponse = await fetch('https://services.leadconnectorhq.com/calendars/groups', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(groupData)
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create group: ${createResponse.status}`);
    }

    const newGroup = await createResponse.json();
    return newGroup.group.id;
  } catch (error) {
    console.error('Error ensuring group:', error);
    throw error;
  }
}

async function createOrUpdateCalendar(payload, accessToken) {
  try {
    // Check if calendar already exists by slug
    const existingCalendar = await findCalendarBySlug(payload.slug, payload.locationId, accessToken);
    
    if (existingCalendar) {
      // Update existing calendar
      const response = await fetch(`https://services.leadconnectorhq.com/calendars/${existingCalendar.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GHL API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { id: data.calendar.id, isUpdate: true };
    } else {
      // Create new calendar
      const response = await fetch('https://services.leadconnectorhq.com/calendars', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GHL API Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return { id: data.calendar.id, isUpdate: false };
    }
  } catch (error) {
    console.error('Error creating/updating calendar:', error);
    throw error;
  }
}

async function findCalendarBySlug(slug, locationId, accessToken) {
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/calendars?locationId=${locationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.calendars?.find(cal => cal.slug === slug) || null;
  } catch (error) {
    console.error('Error finding calendar by slug:', error);
    return null;
  }
}

// Get access token for a location
async function getLocationToken(locationId, env) {
  try {
    const result = await env.DB.prepare(`
      SELECT access_token, refresh_token, expires_at 
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId).first();
    
    if (!result) {
      return null;
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (result.expires_at <= now) {
      console.warn('Token expired for location:', locationId);
      return null;
    }
    
    const accessToken = await decryptToken(result.access_token, env.ENCRYPTION_KEY);
    
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

// Decrypt token
async function decryptToken(encryptedToken, encryptionKey) {
  try {
    const [encryptedData, ivData] = encryptedToken.split(':');
    
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    const encrypted = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivData).split('').map(char => char.charCodeAt(0)));
    
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