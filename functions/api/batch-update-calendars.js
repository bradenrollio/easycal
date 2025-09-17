/**
 * Batch Update Calendars API
 * Handles batch updates for calendar schedules including date/time overrides and blocking days
 * Uses GoHighLevel Calendar API
 */

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

// Helper function to get location token (same as in calendars.js)
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

      result = await env.DB.prepare(`
        SELECT id, access_token, refresh_token, expires_at, user_type, company_id
        FROM tokens
        WHERE user_type = 'Company' AND location_id IS NULL
        ORDER BY expires_at DESC
        LIMIT 1
      `).first();

      if (result) {
        console.log('Found agency token, will use it to get location-specific access');
      }
    }

    if (!result) {
      console.log('No token found in database');
      return null;
    }

    console.log('Token found:', {
      id: result.id,
      userType: result.user_type,
      hasLocation: !!result.location_id,
      expiresAt: result.expires_at
    });

    // Check if token is expired (convert to seconds for comparison)
    if (result.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = result.expires_at;

      if (expiresAt <= now) {
        console.log('Token expired, needs refresh');
        // In production, implement token refresh here
        return null;
      }
    } else {
      console.log('Token has no expiration date, treating as valid');
    }

    // Decrypt the access token
    console.log('Attempting to decrypt token...');
    const accessToken = await decryptToken(result.access_token, env.ENCRYPTION_KEY);
    console.log('Token decrypted successfully');

    return {
      accessToken: accessToken,
      refreshToken: result.refresh_token,
      userType: result.user_type,
      companyId: result.company_id
    };
  } catch (error) {
    console.error('Error getting location token:', error);
    return null;
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const { locationId, calendarIds, updateData } = await request.json();

    if (!locationId || !calendarIds || !updateData) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get access token for this location (using same method as calendars.js)
    const tokenData = await getLocationToken(locationId, env);

    if (!tokenData) {
      console.log('No token found for location:', locationId);
      return new Response(JSON.stringify({
        error: 'Not authenticated',
        message: 'No access token found for this location. Please connect to GoHighLevel first.',
        locationId: locationId
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const accessToken = tokenData.accessToken;
    const results = {
      successful: [],
      failed: []
    };

    // Process each calendar
    for (const calendarId of calendarIds) {
      try {
        // First, fetch the current calendar data from GHL
        const calendarResponse = await fetch(
          `https://services.leadconnectorhq.com/calendars/${calendarId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json',
              'Version': '2021-04-15'
            }
          }
        );

        if (!calendarResponse.ok) {
          const errorText = await calendarResponse.text();
          console.error(`Failed to fetch calendar ${calendarId}:`, errorText);
          throw new Error(`Failed to fetch calendar: ${calendarResponse.status}`);
        }

        const responseData = await calendarResponse.json();
        // GHL returns the calendar wrapped in a 'calendar' property
        const calendarData = responseData.calendar || responseData;
        console.log('Current calendar data:', JSON.stringify(calendarData, null, 2));

        // Extract only the fields that GHL accepts for updates
        // Remove system fields like 'id', 'calendar', 'traceId', etc.
        // Preserve ALL existing calendar configuration
        let updatePayload = {
          name: calendarData.name,
          description: calendarData.description,
          slotDuration: calendarData.slotDuration,
          slotBuffer: calendarData.slotBuffer,
          appoinmentPerSlot: calendarData.appoinmentPerSlot,
          appoinmentPerDay: calendarData.appoinmentPerDay,
          openHours: calendarData.openHours || [],
          availabilityType: calendarData.availabilityType, // CRITICAL: Preserve availability type
          enableRecurring: calendarData.enableRecurring,
          recurring: calendarData.recurring,
          formId: calendarData.formId,
          stickyContact: calendarData.stickyContact,
          isLivePaymentMode: calendarData.isLivePaymentMode,
          autoConfirm: calendarData.autoConfirm,
          shouldSendAlertEmailsToAssignedMember: calendarData.shouldSendAlertEmailsToAssignedMember,
          alertEmail: calendarData.alertEmail,
          googleInvitationEmails: calendarData.googleInvitationEmails,
          allowReschedule: calendarData.allowReschedule,
          allowCancellation: calendarData.allowCancellation,
          shouldAssignContactToTeamMember: calendarData.shouldAssignContactToTeamMember,
          shouldSkipAssigningContactForExisting: calendarData.shouldSkipAssigningContactForExisting,
          notes: calendarData.notes,
          pixelId: calendarData.pixelId,
          formSubmitType: calendarData.formSubmitType,
          formSubmitRedirectURL: calendarData.formSubmitRedirectURL,
          formSubmitThanksMessage: calendarData.formSubmitThanksMessage,
          // Clean availabilities - remove MongoDB fields
          availabilities: (calendarData.availabilities || []).map(avail => ({
            date: avail.date,
            hours: avail.hours || [],
            deleted: avail.deleted === true
          }))
        };

        // Add teamMembers only if they exist and are not empty
        if (calendarData.teamMembers && calendarData.teamMembers.length > 0) {
          updatePayload.teamMembers = calendarData.teamMembers;
        }

        // Remove undefined or empty fields from the payload
        Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key] === undefined ||
              (Array.isArray(updatePayload[key]) && key === 'teamMembers' && updatePayload[key].length === 0)) {
            delete updatePayload[key];
          }
        });

        // Log existing availabilities to understand the structure
        console.log(`Calendar ${calendarId} has ${updatePayload.availabilities.length} existing availabilities`);

        // Convert date to ISO 8601 format with timezone (only for operations that need it)
        const formattedDate = updateData.date ? new Date(updateData.date + 'T00:00:00.000Z').toISOString() : null;

        if (updateData.type === 'remove') {
          // For removing ALL date-specific overrides
          // Based on working cURL, send ONLY openHours, availabilityType, and empty availabilities
          console.log(`Removing ALL date-specific overrides for calendar ${calendarId}`);
          console.log(`Previously had ${updatePayload.availabilities.length} availabilities`);

          // CRITICAL: Preserve openHours and availabilityType
          console.log(`Preserving openHours:`, JSON.stringify(updatePayload.openHours));
          console.log(`Preserving availabilityType:`, updatePayload.availabilityType);

          // VERIFY critical fields are present
          if (!updatePayload.openHours || updatePayload.openHours.length === 0) {
            console.warn(`WARNING: openHours is empty or missing for calendar ${calendarId}`);
          }
          if (updatePayload.availabilityType === undefined || updatePayload.availabilityType === null) {
            console.warn(`WARNING: availabilityType is missing for calendar ${calendarId}, setting to 0`);
            updatePayload.availabilityType = 0; // Default to 0 if missing
          }

          // For remove operation, send ONLY the three required fields (like the working cURL)
          updatePayload = {
            openHours: updatePayload.openHours,
            availabilityType: updatePayload.availabilityType,
            availabilities: []
          };

          // Log to verify we're sending minimal payload like the working cURL
          console.log(`Remove operation sending ONLY essential fields:`);
          console.log(`- openHours: ${updatePayload.openHours?.length || 0} entries`);
          console.log(`- availabilityType: ${updatePayload.availabilityType}`);
          console.log(`- availabilities: [] (empty array)`);
          console.log(`Final remove payload:`, JSON.stringify(updatePayload, null, 2));

        } else if (updateData.type === 'override') {
          // For date-specific time overrides
          // First, filter out any existing entry for this specific date
          // Check both the raw date and ISO format
          const existingAvailabilities = (updatePayload.availabilities || []).filter(
            avail => {
              const availDate = new Date(avail.date).toISOString().split('T')[0];
              const targetDate = updateData.date;
              return availDate !== targetDate;
            }
          );

          console.log(`Keeping ${existingAvailabilities.length} existing availabilities, updating date: ${updateData.date}`);

          // CRITICAL: Preserve openHours and availabilityType for override operation too
          console.log(`Override operation - Preserving openHours:`, JSON.stringify(updatePayload.openHours));
          console.log(`Override operation - Preserving availabilityType:`, updatePayload.availabilityType);

          // Add the new override for this specific date only
          const overrideEntry = {
            date: formattedDate,
            hours: [{
              openHour: parseInt(updateData.startTime.split(':')[0]),
              openMinute: parseInt(updateData.startTime.split(':')[1]),
              closeHour: parseInt(updateData.endTime.split(':')[0]),
              closeMinute: parseInt(updateData.endTime.split(':')[1])
            }],
            deleted: false
          };

          const newAvailabilities = [
            ...existingAvailabilities,
            overrideEntry
          ];

          // Similar to remove and block, send focused payload
          updatePayload = {
            openHours: updatePayload.openHours,
            availabilityType: updatePayload.availabilityType || 0,
            availabilities: newAvailabilities
          };

          console.log(`Override operation - Final availabilities array:`, JSON.stringify(updatePayload.availabilities));

        } else if (updateData.type === 'block') {
          // For blocking entire days
          // First, filter out any existing entry for this specific date
          // Check both the raw date and ISO format
          const existingAvailabilities = (updatePayload.availabilities || []).filter(
            avail => {
              const availDate = new Date(avail.date).toISOString().split('T')[0];
              const targetDate = updateData.date;
              console.log(`Comparing dates - Existing: ${availDate}, Target: ${targetDate}, Keep: ${availDate !== targetDate}`);
              return availDate !== targetDate;
            }
          );

          console.log(`Keeping ${existingAvailabilities.length} existing availabilities, blocking date: ${updateData.date}`);
          console.log(`Formatted date for block: ${formattedDate}`);

          // CRITICAL: Preserve openHours and availabilityType for block operation too
          console.log(`Block operation - Preserving openHours:`, JSON.stringify(updatePayload.openHours));
          console.log(`Block operation - Preserving availabilityType:`, updatePayload.availabilityType);

          // Block the day by setting empty openHours array (no availability)
          // Based on working cURL, use "openHours" not "hours" for blocking
          const blockedEntry = {
            openHours: [],  // Changed from "hours" to "openHours" based on working cURL
            date: formattedDate
          };

          console.log(`Creating blocked entry:`, JSON.stringify(blockedEntry));

          // For block operation, send minimal payload with just the essential calendar fields
          const newAvailabilities = [
            ...existingAvailabilities,
            blockedEntry
          ];

          // Similar to remove, send focused payload
          updatePayload = {
            openHours: updatePayload.openHours,
            availabilityType: updatePayload.availabilityType || 0,
            availabilities: newAvailabilities
          };

          console.log(`Block operation - Final availabilities array:`, JSON.stringify(updatePayload.availabilities));
        }

        console.log(`Final availabilities count: ${updatePayload.availabilities.length}`);

        // Log the final availabilities array being sent
        console.log('Final availabilities being sent to GHL:', JSON.stringify(updatePayload.availabilities, null, 2));
        console.log('Update payload keys:', Object.keys(updatePayload));

        // Log the complete payload for remove and block operations to debug
        if (updateData.type === 'remove' || updateData.type === 'block') {
          console.log(`Complete ${updateData.type} payload being sent:`, JSON.stringify(updatePayload, null, 2));

          // Extra verification for remove operation
          if (updateData.type === 'remove') {
            console.log('REMOVE OPERATION VERIFICATION:');
            console.log('- availabilities is array:', Array.isArray(updatePayload.availabilities));
            console.log('- availabilities length:', updatePayload.availabilities.length);
            console.log('- openHours exists:', !!updatePayload.openHours);
            console.log('- openHours count:', updatePayload.openHours?.length || 0);
            console.log('- availabilityType:', updatePayload.availabilityType);
          }
        }

        // Log the exact payload being sent to GHL
        console.log('PAYLOAD BEING SENT TO GHL:');
        console.log(JSON.stringify(updatePayload, null, 2));

        // Update calendar in GHL using PUT request
        const updateResponse = await fetch(
          `https://services.leadconnectorhq.com/calendars/${calendarId}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Version': '2021-04-15'
            },
            body: JSON.stringify(updatePayload)
          }
        );

        const responseText = await updateResponse.text();
        console.log(`Update response status: ${updateResponse.status}`);
        console.log(`Update response for calendar ${calendarId}:`, responseText);

        // Parse and log the response to understand what GHL is returning
        try {
          const responseJson = JSON.parse(responseText);
          if (responseJson.calendar && responseJson.calendar.availabilities) {
            console.log(`GHL returned ${responseJson.calendar.availabilities.length} availabilities`);
          }
        } catch (e) {
          console.log('Could not parse response as JSON');
        }

        if (updateResponse.ok) {
          results.successful.push({
            calendarId,
            name: calendarData.name || calendarData.title || 'Unknown',
            // Include debug info for block operations
            ...(updateData.type === 'block' && {
              debug_payload: {
                openHours_count: updatePayload.openHours?.length || 0,
                availabilityType: updatePayload.availabilityType,
                availabilities: updatePayload.availabilities
              }
            })
          });
        } else {
          throw new Error(`Update failed: ${responseText}`);
        }

      } catch (error) {
        console.error(`Failed to update calendar ${calendarId}:`, error);
        results.failed.push({
          calendarId,
          error: error.message
        });
      }
    }

    // Store update history in database for tracking (optional)
    try {
      // First, ensure the table exists
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS batch_updates (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          location_id TEXT NOT NULL,
          update_type TEXT NOT NULL,
          update_data TEXT NOT NULL,
          calendars_updated TEXT NOT NULL,
          successful_count INTEGER NOT NULL,
          failed_count INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Log the batch update
      await env.DB.prepare(`
        INSERT INTO batch_updates (
          location_id,
          update_type,
          update_data,
          calendars_updated,
          successful_count,
          failed_count
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        locationId,
        updateData.type,
        JSON.stringify(updateData),
        JSON.stringify(calendarIds),
        results.successful.length,
        results.failed.length
      ).run();
    } catch (err) {
      console.log('Could not log batch update (optional):', err);
      // This is optional logging, so we don't fail the request
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Updated ${results.successful.length} calendar(s)`,
      results,
      note: 'Calendar structure varies by GHL configuration. Check console logs for field mapping.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Batch update error:', error);
    return new Response(JSON.stringify({
      error: 'Batch update failed',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Helper function to modify schedule for a specific date
 */
function modifyScheduleForDate(schedule, updateData) {
  if (!schedule) return schedule;

  // Clone the schedule
  const modifiedSchedule = JSON.parse(JSON.stringify(schedule));

  // If schedule has a dateOverrides field
  if (!modifiedSchedule.dateOverrides) {
    modifiedSchedule.dateOverrides = {};
  }

  // Add the date override
  modifiedSchedule.dateOverrides[updateData.date] = {
    startTime: updateData.startTime,
    endTime: updateData.endTime,
    available: true
  };

  return modifiedSchedule;
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

/**
 * GET endpoint to fetch calendar structure for debugging
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const calendarId = url.searchParams.get('calendarId');
  const locationId = url.searchParams.get('locationId');

  if (!calendarId || !locationId) {
    return new Response(JSON.stringify({
      error: 'Missing calendarId or locationId'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Get token using the same method
    const tokenData = await getLocationToken(locationId, env);

    if (!tokenData) {
      return new Response(JSON.stringify({
        error: 'No authentication found'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch calendar
    const response = await fetch(
      `https://services.leadconnectorhq.com/calendars/${calendarId}`,
      {
        headers: {
          'Authorization': `Bearer ${tokenData.accessToken}`,
          'Accept': 'application/json',
          'Version': '2021-04-15'
        }
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      calendar: data,
      structure: {
        topLevelFields: Object.keys(data || {}),
        scheduleFields: data.schedule ? Object.keys(data.schedule) : [],
        availabilityFields: data.availability ? Object.keys(data.availability) : [],
        note: 'Use this structure to understand how GHL stores calendar data'
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to fetch calendar',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}