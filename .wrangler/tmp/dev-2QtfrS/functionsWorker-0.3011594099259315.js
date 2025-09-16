var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-lDZBDJ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-Ng4bJG/functionsWorker-0.3011594099259315.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (request.method === "GET") {
      return handleGetDefaults(url, env, corsHeaders);
    } else if (request.method === "POST") {
      return handlePostDefaults(request, env, corsHeaders);
    } else {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders
      });
    }
  } catch (error) {
    console.error("Defaults API error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest, "onRequest");
__name2(onRequest, "onRequest");
async function handleGetDefaults(url, env, corsHeaders) {
  const locationId2 = url.searchParams.get("locationId");
  if (!locationId2) {
    return new Response(JSON.stringify({
      error: "locationId parameter is required"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const kvKey = `location:${locationId2}:defaults`;
  const defaultsStr = await env.EASYCAL_SESSIONS.get(kvKey);
  if (!defaultsStr) {
    const defaultDefaults = {
      locationId: locationId2,
      defaultSlotDurationMinutes: 30,
      minSchedulingNoticeDays: 1,
      bookingWindowDays: 30,
      spotsPerBooking: 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return new Response(JSON.stringify(defaultDefaults), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const defaults = JSON.parse(defaultsStr);
  return new Response(JSON.stringify(defaults), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(handleGetDefaults, "handleGetDefaults");
__name2(handleGetDefaults, "handleGetDefaults");
async function handlePostDefaults(request, env, corsHeaders) {
  const defaults = await request.json();
  const errors = validateCalendarDefaults(defaults);
  if (errors.length > 0) {
    return new Response(JSON.stringify({
      error: "Validation failed",
      errors
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  defaults.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const kvKey = `location:${defaults.locationId}:defaults`;
  await env.EASYCAL_SESSIONS.put(kvKey, JSON.stringify(defaults));
  return new Response(JSON.stringify(defaults), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(handlePostDefaults, "handlePostDefaults");
__name2(handlePostDefaults, "handlePostDefaults");
function validateCalendarDefaults(defaults) {
  const errors = [];
  if (!defaults.locationId) {
    errors.push("Location ID is required");
  }
  if (!defaults.defaultSlotDurationMinutes || defaults.defaultSlotDurationMinutes < 1) {
    errors.push("Default slot duration must be a positive number");
  }
  if (!defaults.minSchedulingNoticeDays || defaults.minSchedulingNoticeDays < 0) {
    errors.push("Minimum scheduling notice must be 0 or greater");
  }
  if (!defaults.bookingWindowDays || defaults.bookingWindowDays < 1) {
    errors.push("Booking window must be at least 1 day");
  }
  if (!defaults.spotsPerBooking || defaults.spotsPerBooking < 1) {
    errors.push("Spots per booking must be at least 1");
  }
  if (defaults.defaultTimezone) {
    try {
      Intl.DateTimeFormat(void 0, { timeZone: defaults.defaultTimezone });
    } catch {
      errors.push("Invalid timezone format");
    }
  }
  return errors;
}
__name(validateCalendarDefaults, "validateCalendarDefaults");
__name2(validateCalendarDefaults, "validateCalendarDefaults");
async function onRequest2(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    if (request.method === "GET") {
      return handleGetBrandConfig(url, env, corsHeaders);
    } else if (request.method === "POST") {
      return handlePostBrandConfig(request, env, corsHeaders);
    } else {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders
      });
    }
  } catch (error) {
    console.error("Brand Config API error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest2, "onRequest2");
__name2(onRequest2, "onRequest");
async function handleGetBrandConfig(url, env, corsHeaders) {
  const locationId2 = url.searchParams.get("locationId");
  if (!locationId2) {
    return new Response(JSON.stringify({
      error: "locationId parameter is required"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const kvKey = `location:${locationId2}:brand`;
  const configStr = await env.EASYCAL_SESSIONS.get(kvKey);
  if (!configStr) {
    const defaultConfig = {
      locationId: locationId2,
      primaryColorHex: "#FFC300",
      backgroundColorHex: "#FFFFFF",
      defaultButtonText: "Book Now",
      timezone: "America/New_York",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return new Response(JSON.stringify(defaultConfig), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  const config = JSON.parse(configStr);
  return new Response(JSON.stringify(config), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(handleGetBrandConfig, "handleGetBrandConfig");
__name2(handleGetBrandConfig, "handleGetBrandConfig");
async function handlePostBrandConfig(request, env, corsHeaders) {
  const config = await request.json();
  const errors = validateBrandConfig(config);
  if (errors.length > 0) {
    return new Response(JSON.stringify({
      error: "Validation failed",
      errors
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
  config.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const kvKey = `location:${config.locationId}:brand`;
  await env.EASYCAL_SESSIONS.put(kvKey, JSON.stringify(config));
  return new Response(JSON.stringify(config), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(handlePostBrandConfig, "handlePostBrandConfig");
__name2(handlePostBrandConfig, "handlePostBrandConfig");
function validateBrandConfig(config) {
  const errors = [];
  if (!config.locationId) {
    errors.push("Location ID is required");
  }
  if (!config.primaryColorHex || !/^#[0-9a-fA-F]{6}$/.test(config.primaryColorHex)) {
    errors.push("Primary color must be a valid hex color (#RRGGBB)");
  }
  if (!config.backgroundColorHex || !/^#[0-9a-fA-F]{6}$/.test(config.backgroundColorHex)) {
    errors.push("Background color must be a valid hex color (#RRGGBB)");
  }
  if (!config.defaultButtonText || config.defaultButtonText.length < 3 || config.defaultButtonText.length > 30) {
    errors.push("Default button text must be 3-30 characters");
  }
  if (config.timezone) {
    try {
      Intl.DateTimeFormat(void 0, { timeZone: config.timezone });
    } catch {
      errors.push("Invalid timezone format");
    }
  }
  return errors;
}
__name(validateBrandConfig, "validateBrandConfig");
__name2(validateBrandConfig, "validateBrandConfig");
async function onRequest3(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const locationId2 = url.searchParams.get("locationId");
    if (!locationId2) {
      return new Response(JSON.stringify({
        error: "locationId parameter is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const tokenData = await getLocationToken(locationId2, env);
    if (!tokenData) {
      console.log("No token found for location:", locationId2);
      return new Response(JSON.stringify({
        error: "Not authenticated",
        message: "No access token found for this location. Please connect to Enrollio first.",
        locationId: locationId2
      }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (request.method === "GET") {
      return handleListCalendars(tokenData.accessToken, locationId2, corsHeaders);
    } else if (request.method === "POST") {
      return handleCreateCalendar(request, tokenData.accessToken, locationId2, corsHeaders);
    } else if (request.method === "DELETE") {
      return handleDeleteCalendars(request, tokenData.accessToken, locationId2, corsHeaders);
    } else {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders
      });
    }
  } catch (error) {
    console.error("Calendar API error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
async function getLocationToken(locationId2, env) {
  try {
    console.log("Looking for token for location:", locationId2);
    let result = await env.DB.prepare(`
      SELECT id, access_token, refresh_token, expires_at, user_type, company_id
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId2).first();
    if (!result && (locationId2 === "temp_location" || locationId2?.startsWith("temp_") || locationId2?.startsWith("agency_"))) {
      console.log("No direct location token found, checking for agency token...");
      console.log("Looking for agency token with user_type = Company and location_id IS NULL");
      result = await env.DB.prepare(`
        SELECT id, access_token, refresh_token, expires_at, user_type, company_id
        FROM tokens 
        WHERE user_type = 'Company' AND location_id IS NULL
        ORDER BY expires_at DESC 
        LIMIT 1
      `).first();
      console.log("Agency token query result:", result ? "found" : "not found");
      if (result) {
        console.log("Found agency token, will use it to get location-specific access");
      }
    }
    console.log("Token query result:", result ? "found" : "not found");
    if (!result) {
      console.log("No token found for location:", locationId2);
      return null;
    }
    const now = Math.floor(Date.now() / 1e3);
    console.log("Token expires at:", result.expires_at, "Current time:", now);
    if (result.expires_at <= now) {
      console.warn("Token expired for location:", locationId2, "- attempting to refresh...");
      const refreshToken = await decryptToken(result.refresh_token, env.ENCRYPTION_KEY);
      const newTokenData = await refreshAccessToken(refreshToken, env);
      if (!newTokenData) {
        console.error("Failed to refresh token for location:", locationId2);
        return null;
      }
      const encryptedTokens = await encryptTokens({
        accessToken: newTokenData.access_token,
        refreshToken: newTokenData.refresh_token || refreshToken
        // Use new refresh token if provided, otherwise keep the old one
      }, env.ENCRYPTION_KEY);
      await env.DB.prepare(`
        UPDATE tokens 
        SET access_token = ?, 
            refresh_token = ?,
            expires_at = ?
        WHERE id = ?
      `).bind(
        encryptedTokens.accessToken,
        encryptedTokens.refreshToken,
        Math.floor((Date.now() + newTokenData.expires_in * 1e3) / 1e3),
        result.id
      ).run();
      console.log("Token refreshed successfully for location:", locationId2);
      return {
        accessToken: newTokenData.access_token,
        refreshToken: newTokenData.refresh_token || refreshToken,
        expiresAt: Math.floor((Date.now() + newTokenData.expires_in * 1e3) / 1e3)
      };
    }
    console.log("Attempting to decrypt token...");
    const accessToken = await decryptToken(result.access_token, env.ENCRYPTION_KEY);
    console.log("Token decrypted successfully");
    if (result.user_type === "Company" && result.company_id) {
      console.log("Agency token detected, getting location-specific token...");
      try {
        const actualLocationId = locationId2 === "temp_location" || locationId2?.startsWith("temp_") || locationId2?.startsWith("agency_") ? null : locationId2;
        if (!actualLocationId) {
          console.error("Cannot use agency token without a valid location ID");
          return null;
        }
        return await getLocationTokenDirect(accessToken, result.company_id, actualLocationId);
      } catch (error) {
        console.error("Error getting location token:", error);
        return null;
      }
    }
    return {
      accessToken,
      refreshToken: result.refresh_token,
      expiresAt: result.expires_at
    };
  } catch (error) {
    console.error("Error getting location token:", error);
    return null;
  }
}
__name(getLocationToken, "getLocationToken");
__name2(getLocationToken, "getLocationToken");
async function refreshAccessToken(refreshToken, env) {
  try {
    console.log("Refreshing access token...");
    const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.HL_CLIENT_ID,
        client_secret: env.HL_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        user_type: "Location"
      }).toString()
    });
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token refresh failed:", tokenResponse.status, errorText);
      return null;
    }
    const tokenData = await tokenResponse.json();
    console.log("Token refreshed successfully");
    return tokenData;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}
__name(refreshAccessToken, "refreshAccessToken");
__name2(refreshAccessToken, "refreshAccessToken");
async function encryptTokens(tokens, encryptionKey) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedAccessToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: accessTokenIv },
      key,
      new TextEncoder().encode(tokens.accessToken)
    );
    const refreshTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedRefreshToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: refreshTokenIv },
      key,
      new TextEncoder().encode(tokens.refreshToken)
    );
    return {
      accessToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedAccessToken)))}:${btoa(String.fromCharCode(...accessTokenIv))}`,
      refreshToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedRefreshToken)))}:${btoa(String.fromCharCode(...refreshTokenIv))}`
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt tokens");
  }
}
__name(encryptTokens, "encryptTokens");
__name2(encryptTokens, "encryptTokens");
async function getLocationTokenDirect(agencyToken, companyId2, locationId2) {
  try {
    console.log("Getting location token directly for:", { companyId: companyId2, locationId: locationId2 });
    const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/locationToken", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${agencyToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        companyId: companyId2,
        locationId: locationId2
      }).toString()
    });
    console.log("Location token API response status:", tokenResponse.status);
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Failed to get location token:", tokenResponse.status, errorText);
      return null;
    }
    const tokenData = await tokenResponse.json();
    console.log("Successfully obtained location token for location:", locationId2);
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Math.floor(Date.now() / 1e3) + (tokenData.expires_in || 86400)
    };
  } catch (error) {
    console.error("Error getting location token directly:", error);
    return null;
  }
}
__name(getLocationTokenDirect, "getLocationTokenDirect");
__name2(getLocationTokenDirect, "getLocationTokenDirect");
async function decryptToken(encryptedToken, encryptionKey) {
  try {
    const [encryptedData, ivData] = encryptedToken.split(":");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const encrypted = new Uint8Array(atob(encryptedData).split("").map((char) => char.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivData).split("").map((char) => char.charCodeAt(0)));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt token");
  }
}
__name(decryptToken, "decryptToken");
__name2(decryptToken, "decryptToken");
async function handleListCalendars(accessToken, locationId2, corsHeaders) {
  try {
    const actualLocationId = locationId2;
    console.log("Making GHL API call to list calendars for location:", actualLocationId);
    console.log("Original locationId:", locationId2, "Actual locationId:", actualLocationId);
    console.log("Using access token (first 10 chars):", accessToken.substring(0, 10));
    const endpoint = `https://services.leadconnectorhq.com/calendars/?locationId=${actualLocationId}&showDrafted=true`;
    console.log("Using GHL API endpoint:", endpoint);
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json"
      }
    });
    console.log("GHL API response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("GHL API error details:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      return new Response(JSON.stringify({
        error: "Failed to fetch calendars from GHL API",
        status: response.status,
        details: errorText,
        endpoint
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const data = await response.json();
    console.log("GHL API success! Calendars found:", data.calendars?.length || 0);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error listing calendars:", error);
    return new Response(JSON.stringify({
      error: "Failed to list calendars",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleListCalendars, "handleListCalendars");
__name2(handleListCalendars, "handleListCalendars");
async function handleCreateCalendar(request, accessToken, locationId2, corsHeaders) {
  try {
    const calendarData = await request.json();
    if (!calendarData.name || !calendarData.slug) {
      return new Response(JSON.stringify({
        error: "Calendar name and slug are required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const createData = {
      ...calendarData,
      locationId: locationId2
    };
    const response = await fetch("https://services.leadconnectorhq.com/calendars", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createData)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("GHL API error:", response.status, errorText);
      return new Response(JSON.stringify({
        error: "Failed to create calendar in GHL API",
        details: errorText
      }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error creating calendar:", error);
    return new Response(JSON.stringify({
      error: "Failed to create calendar",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleCreateCalendar, "handleCreateCalendar");
__name2(handleCreateCalendar, "handleCreateCalendar");
async function handleDeleteCalendars(request, accessToken, locationId2, corsHeaders) {
  try {
    const { calendarIds } = await request.json();
    if (!calendarIds || !Array.isArray(calendarIds)) {
      return new Response(JSON.stringify({
        error: "calendarIds array is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (calendarIds.length === 0) {
      return new Response(JSON.stringify({
        error: "No calendar IDs provided for deletion"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const validCalendarIds = calendarIds.filter(
      (id) => typeof id === "string" && id.trim().length > 0
    );
    if (validCalendarIds.length !== calendarIds.length) {
      console.warn(`Filtered out ${calendarIds.length - validCalendarIds.length} invalid calendar IDs`);
    }
    if (validCalendarIds.length === 0) {
      return new Response(JSON.stringify({
        error: "All provided calendar IDs were invalid"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    console.log(`Received request to delete ${validCalendarIds.length} valid calendars:`, validCalendarIds);
    const results = { success: [], failed: [] };
    for (const calendarId of validCalendarIds) {
      try {
        console.log(`Attempting to delete calendar: ${calendarId} for location: ${locationId2}`);
        const deleteUrl = `https://services.leadconnectorhq.com/calendars/${calendarId}`;
        console.log("DELETE URL:", deleteUrl);
        const response = await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Version": "2021-07-28",
            "Accept": "application/json"
          }
        });
        console.log(`Delete response status for ${calendarId}:`, response.status);
        console.log(`Response headers:`, response.headers);
        let responseBody = "";
        try {
          responseBody = await response.text();
          console.log(`Response body for ${calendarId}:`, responseBody || "(empty)");
        } catch (e) {
          console.log(`Could not read response body for ${calendarId}:`, e);
        }
        console.log(`Delete response for ${calendarId}: status=${response.status}, body='${responseBody}'`);
        if (response.status === 200 || response.status === 202 || response.status === 204) {
          console.log(`Calendar ${calendarId} deleted successfully (explicit success status ${response.status})`);
          results.success.push(calendarId);
        } else if (response.status === 404) {
          console.log(`Calendar ${calendarId} not found - treating as successful deletion`);
          results.success.push(calendarId);
        } else if (response.status === 422) {
          console.log(`Calendar ${calendarId} returned 422 - likely already deleted, verifying...`);
          const verifyUrl = `https://services.leadconnectorhq.com/calendars/${calendarId}`;
          try {
            const quickCheck = await fetch(verifyUrl, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Version": "2021-07-28"
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
            console.log(`Calendar ${calendarId} returned 422, cannot verify, assuming success`);
            results.success.push(calendarId);
          }
        } else {
          console.log(`Ambiguous delete status for ${calendarId}, verifying...`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          try {
            const verifyUrl = `https://services.leadconnectorhq.com/calendars/${calendarId}`;
            const verifyResponse = await fetch(verifyUrl, {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Version": "2021-07-28",
                "Accept": "application/json"
              }
            });
            console.log(`Verification GET for ${calendarId} returned status: ${verifyResponse.status}`);
            if (verifyResponse.status === 404) {
              console.log(`Verified: Calendar ${calendarId} successfully deleted (404 on verification)`);
              results.success.push(calendarId);
            } else if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData && verifyData.id === calendarId) {
                console.log(`Verified: Calendar ${calendarId} still exists - deletion failed`);
                results.failed.push({
                  id: calendarId,
                  error: `Calendar still exists after deletion attempt`
                });
              } else {
                console.log(`Ambiguous verification for ${calendarId}, treating as success`);
                results.success.push(calendarId);
              }
            } else {
              console.log(`Calendar ${calendarId} verification returned ${verifyResponse.status}, assuming deleted`);
              results.success.push(calendarId);
            }
          } catch (verifyError) {
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
    console.log("Final delete results:", {
      successCount: results.success.length,
      failedCount: results.failed.length,
      success: results.success,
      failed: results.failed
    });
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Error deleting calendars:", error);
    return new Response(JSON.stringify({
      error: "Failed to delete calendars",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(handleDeleteCalendars, "handleDeleteCalendars");
__name2(handleDeleteCalendars, "handleDeleteCalendars");
async function onRequest4(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const locationId2 = url.searchParams.get("locationId") || "EnUqtThIwW8pdTLOvuO7";
    console.log("DEBUG: Testing token for location:", locationId2);
    const result = await env.DB.prepare(`
      SELECT id, access_token, refresh_token, expires_at, scope
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId2).first();
    if (!result) {
      return new Response(JSON.stringify({
        error: "No token found",
        locationId: locationId2,
        debug: "Token not found in database"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const now = Math.floor(Date.now() / 1e3);
    let isExpired = result.expires_at <= now;
    console.log("DEBUG: Token found, expires:", result.expires_at, "now:", now, "expired:", isExpired);
    if (isExpired) {
      console.log("DEBUG: Token expired, attempting refresh...");
      let refreshToken;
      try {
        refreshToken = await decryptToken2(result.refresh_token, env.ENCRYPTION_KEY);
      } catch (err) {
        return new Response(JSON.stringify({
          error: "Failed to decrypt refresh token",
          locationId: locationId2,
          debug: err.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const newTokenData = await refreshAccessToken2(refreshToken, env);
      if (!newTokenData) {
        return new Response(JSON.stringify({
          error: "Token refresh failed",
          locationId: locationId2,
          expiresAt: result.expires_at,
          currentTime: now,
          debug: "Failed to refresh expired token"
        }), {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const encryptedTokens = await encryptTokens2({
        accessToken: newTokenData.access_token,
        refreshToken: newTokenData.refresh_token || refreshToken
      }, env.ENCRYPTION_KEY);
      await env.DB.prepare(`
        UPDATE tokens 
        SET access_token = ?, 
            refresh_token = ?,
            expires_at = ?
        WHERE id = ?
      `).bind(
        encryptedTokens.accessToken,
        encryptedTokens.refreshToken,
        Math.floor((Date.now() + newTokenData.expires_in * 1e3) / 1e3),
        result.id
      ).run();
      console.log("DEBUG: Token refreshed successfully");
      result.access_token = encryptedTokens.accessToken;
      result.expires_at = Math.floor((Date.now() + newTokenData.expires_in * 1e3) / 1e3);
      isExpired = false;
    }
    let accessToken;
    try {
      accessToken = await decryptToken2(result.access_token, env.ENCRYPTION_KEY);
      console.log("DEBUG: Token decrypted successfully, length:", accessToken.length);
    } catch (decryptError) {
      console.error("DEBUG: Token decryption failed:", decryptError);
      return new Response(JSON.stringify({
        error: "Token decryption failed",
        locationId: locationId2,
        debug: decryptError.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    try {
      const ghlResponse = await fetch(`https://services.leadconnectorhq.com/calendars?locationId=${locationId2}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Version": "2021-07-28",
          "Content-Type": "application/json"
        }
      });
      console.log("DEBUG: GHL API response status:", ghlResponse.status);
      if (!ghlResponse.ok) {
        const errorText = await ghlResponse.text();
        console.error("DEBUG: GHL API error:", errorText);
        return new Response(JSON.stringify({
          error: "GHL API call failed",
          locationId: locationId2,
          status: ghlResponse.status,
          debug: errorText
        }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const ghlData = await ghlResponse.json();
      console.log("DEBUG: GHL API success, calendars count:", ghlData.calendars?.length || 0);
      return new Response(JSON.stringify({
        success: true,
        locationId: locationId2,
        calendarsCount: ghlData.calendars?.length || 0,
        calendars: ghlData.calendars?.slice(0, 3) || [],
        // First 3 for debugging
        debug: "All checks passed"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } catch (apiError) {
      console.error("DEBUG: API call error:", apiError);
      return new Response(JSON.stringify({
        error: "API call failed",
        locationId: locationId2,
        debug: apiError.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  } catch (error) {
    console.error("DEBUG: General error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      debug: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest4, "onRequest4");
__name2(onRequest4, "onRequest");
async function decryptToken2(encryptedToken, encryptionKey) {
  try {
    const [encryptedData, ivData] = encryptedToken.split(":");
    if (!encryptedData || !ivData) {
      throw new Error("Invalid encrypted token format");
    }
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const encrypted = new Uint8Array(atob(encryptedData).split("").map((char) => char.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivData).split("").map((char) => char.charCodeAt(0)));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error(`Failed to decrypt token: ${error.message}`);
  }
}
__name(decryptToken2, "decryptToken2");
__name2(decryptToken2, "decryptToken");
async function refreshAccessToken2(refreshToken, env) {
  try {
    console.log("DEBUG: Refreshing access token...");
    const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.HL_CLIENT_ID,
        client_secret: env.HL_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        user_type: "Location"
      }).toString()
    });
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("DEBUG: Token refresh failed:", tokenResponse.status, errorText);
      return null;
    }
    const tokenData = await tokenResponse.json();
    console.log("DEBUG: Token refreshed successfully");
    return tokenData;
  } catch (error) {
    console.error("DEBUG: Error refreshing token:", error);
    return null;
  }
}
__name(refreshAccessToken2, "refreshAccessToken2");
__name2(refreshAccessToken2, "refreshAccessToken");
async function encryptTokens2(tokens, encryptionKey) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedAccessToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: accessTokenIv },
      key,
      new TextEncoder().encode(tokens.accessToken)
    );
    const refreshTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedRefreshToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: refreshTokenIv },
      key,
      new TextEncoder().encode(tokens.refreshToken)
    );
    return {
      accessToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedAccessToken)))}:${btoa(String.fromCharCode(...accessTokenIv))}`,
      refreshToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedRefreshToken)))}:${btoa(String.fromCharCode(...refreshTokenIv))}`
    };
  } catch (error) {
    console.error("DEBUG: Encryption error:", error);
    throw new Error("Failed to encrypt tokens");
  }
}
__name(encryptTokens2, "encryptTokens2");
__name2(encryptTokens2, "encryptTokens");
async function onRequest5(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const tokenResult = await env.DB.prepare(`
      SELECT t.location_id, t.user_type, t.company_id, t.expires_at,
             l.name as location_name, l.time_zone
      FROM tokens t
      LEFT JOIN locations l ON l.id = t.location_id
      WHERE t.expires_at > ?
      ORDER BY 
        CASE WHEN t.user_type = 'Location' THEN 0 ELSE 1 END,
        CASE WHEN t.location_id NOT LIKE 'temp_%' AND t.location_id NOT LIKE 'agency_%' THEN 0 ELSE 1 END,
        t.expires_at DESC
      LIMIT 1
    `).bind(Math.floor(Date.now() / 1e3)).first();
    if (!tokenResult) {
      return new Response(JSON.stringify({
        error: "No valid tokens found"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    if (tokenResult.user_type === "Company") {
      return new Response(JSON.stringify({
        locationId: tokenResult.location_id,
        companyId: tokenResult.company_id,
        userType: "Company",
        isAgencyInstall: true,
        locationName: "Agency Installation",
        timeZone: "America/New_York"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    return new Response(JSON.stringify({
      locationId: tokenResult.location_id,
      companyId: tokenResult.company_id,
      userType: "Location",
      isAgencyInstall: false,
      locationName: tokenResult.location_name || "Location Installation",
      timeZone: tokenResult.time_zone || "America/New_York"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Detect location error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest5, "onRequest5");
__name2(onRequest5, "onRequest");
async function onRequest6(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const { locationId: locationId2, csvRows, brandConfig, defaults } = await request.json();
    console.log("Import request received for location:", locationId2);
    console.log("CSV rows count:", csvRows?.length);
    if (!locationId2 || !csvRows || !Array.isArray(csvRows)) {
      return new Response(JSON.stringify({
        error: "locationId and csvRows are required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    console.log("Looking for token for location:", locationId2);
    const tokenData = await getLocationToken2(locationId2, env);
    if (!tokenData) {
      console.error("No token found for location:", locationId2);
      return new Response(JSON.stringify({
        error: "No access token found for location"
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    console.log("Token found with tenant_id:", tokenData.tenantId);
    const jobId = generateId();
    await env.DB.prepare(`
      INSERT INTO jobs (id, tenant_id, location_id, type, status, total, success_count, error_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      jobId,
      tokenData.tenantId,
      // Use actual tenant_id from token
      locationId2,
      "create_calendars",
      "running",
      csvRows.length,
      0,
      0,
      Math.floor(Date.now() / 1e3),
      Math.floor(Date.now() / 1e3)
    ).run();
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    const groupCache = /* @__PURE__ */ new Map();
    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      try {
        const validationErrors = validateCSVRow(row, i);
        if (validationErrors.some((e) => e.severity === "error")) {
          const errorResult = {
            success: false,
            slug: row.custom_url || slugify(row.calendar_name),
            name: row.calendar_name,
            error: validationErrors.filter((e) => e.severity === "error").map((e) => e.message).join("; "),
            warnings: validationErrors.filter((e) => e.severity === "warning").map((e) => e.message)
          };
          results.push(errorResult);
          errorCount++;
          continue;
        }
        let groupId;
        if (row.calendar_group) {
          if (groupCache.has(row.calendar_group)) {
            groupId = groupCache.get(row.calendar_group);
          } else {
            try {
              groupId = await ensureGroup(row.calendar_group, locationId2, tokenData.accessToken);
              groupCache.set(row.calendar_group, groupId);
            } catch (groupError) {
              console.warn(`Could not create/find group "${row.calendar_group}", proceeding without group:`, groupError.message);
              groupId = null;
            }
          }
        }
        const payload = buildCalendarPayload(row, brandConfig, defaults, locationId2, groupId);
        const result = await createOrUpdateCalendar(payload, tokenData.accessToken);
        const successResult = {
          success: true,
          calendarId: result.id,
          slug: payload.slug,
          name: payload.name,
          isUpdate: result.isUpdate,
          message: result.message,
          warnings: validationErrors.filter((e) => e.severity === "warning").map((e) => e.message)
        };
        results.push(successResult);
        successCount++;
        await env.DB.prepare(`
          INSERT INTO job_items (id, job_id, input, result, status, error_message)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(),
          jobId,
          JSON.stringify(row),
          JSON.stringify(successResult),
          "success",
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
        await env.DB.prepare(`
          INSERT INTO job_items (id, job_id, input, result, status, error_message)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          generateId(),
          jobId,
          JSON.stringify(row),
          JSON.stringify(errorResult),
          "error",
          error.message
        ).run();
      }
    }
    const finalStatus = errorCount === 0 ? "success" : successCount === 0 ? "error" : "partial";
    await env.DB.prepare(`
      UPDATE jobs 
      SET status = ?, success_count = ?, error_count = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      finalStatus,
      successCount,
      errorCount,
      Math.floor(Date.now() / 1e3),
      jobId
    ).run();
    return new Response(JSON.stringify({
      success: true,
      jobId,
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        updated: results.filter((r) => r.success && r.isUpdate).length,
        created: results.filter((r) => r.success && !r.isUpdate).length
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Import calendars error:", error);
    return new Response(JSON.stringify({
      error: "Import failed",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest6, "onRequest6");
__name2(onRequest6, "onRequest");
function validateScheduleBlocksFormat(scheduleStr) {
  if (!scheduleStr?.trim()) {
    return { valid: false, error: "Schedule blocks are required" };
  }
  const validDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const segments = scheduleStr.split(";").map((s) => s.trim()).filter((s) => s);
  if (segments.length === 0) {
    return { valid: false, error: "No valid schedule blocks found" };
  }
  const errors = [];
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const formatMatch = segment.match(/^(\w+)\s(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/);
    if (!formatMatch) {
      errors.push(`Segment ${i + 1} "${segment}" doesn't match required format "Day HH:MM-HH:MM"`);
      continue;
    }
    const [, day, startTime, endTime] = formatMatch;
    if (!validDays.includes(day)) {
      errors.push(`Segment ${i + 1}: "${day}" is not a valid day. Use: ${validDays.join(", ")}`);
    }
    const validateTime = /* @__PURE__ */ __name2((time) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
    }, "validateTime");
    if (!validateTime(startTime)) {
      errors.push(`Segment ${i + 1}: Invalid start time "${startTime}". Use 24-hour format (00:00-23:59)`);
    }
    if (!validateTime(endTime)) {
      errors.push(`Segment ${i + 1}: Invalid end time "${endTime}". Use 24-hour format (00:00-23:59)`);
    }
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    if (endMinutes <= startMinutes) {
      errors.push(`Segment ${i + 1}: End time must be after start time`);
    }
  }
  if (errors.length > 0) {
    return { valid: false, error: errors.join("; ") };
  }
  return { valid: true };
}
__name(validateScheduleBlocksFormat, "validateScheduleBlocksFormat");
__name2(validateScheduleBlocksFormat, "validateScheduleBlocksFormat");
function validateCSVRow(row, rowIndex) {
  const errors = [];
  if (!row.calendar_name?.trim()) {
    errors.push({ row: rowIndex, field: "calendar_name", message: "Calendar name is required", severity: "error" });
  }
  const scheduleValidation = validateScheduleBlocksFormat(row.schedule_blocks);
  if (!scheduleValidation.valid) {
    errors.push({
      row: rowIndex,
      field: "schedule_blocks",
      message: `Invalid schedule blocks format: ${scheduleValidation.error}. Required format: "Day HH:MM-HH:MM" separated by semicolons. Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun. Example: "Mon 09:00-17:00; Tue 09:00-17:00"`,
      severity: "error"
    });
  }
  const slotInterval = parseInt(row.slot_interval_minutes);
  const classDuration = parseInt(row.class_duration_minutes);
  if (isNaN(slotInterval) || slotInterval <= 0) {
    errors.push({ row: rowIndex, field: "slot_interval_minutes", message: "Slot interval must be a positive number", severity: "error" });
  }
  if (isNaN(classDuration) || classDuration <= 0) {
    errors.push({ row: rowIndex, field: "class_duration_minutes", message: "Class duration must be a positive number", severity: "error" });
  }
  return errors;
}
__name(validateCSVRow, "validateCSVRow");
__name2(validateCSVRow, "validateCSVRow");
function slugify(name) {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
__name(slugify, "slugify");
__name2(slugify, "slugify");
function applyBranding(row, brandConfig) {
  const primaryColor = row.primary_color_hex || brandConfig?.primaryColorHex || "#FFC300";
  const backgroundColor = row.background_color_hex || brandConfig?.backgroundColorHex || "#FFFFFF";
  let buttonText = row.button_text;
  if (!buttonText) {
    if (row.calendar_purpose === "makeup") {
      buttonText = "Schedule Make-Up";
    } else {
      buttonText = brandConfig?.defaultButtonText || "Book Now";
    }
  }
  return { primaryColor, backgroundColor, buttonText };
}
__name(applyBranding, "applyBranding");
__name2(applyBranding, "applyBranding");
function buildCalendarPayload(row, brandConfig, defaults, locationId2, groupId) {
  const branding = applyBranding(row, brandConfig);
  const slug = row.custom_url || slugify(row.calendar_name);
  const blocks = parseScheduleBlocks(row.schedule_blocks);
  const payload = {
    // Required fields
    isActive: true,
    locationId: locationId2,
    name: row.calendar_name,
    description: row.class_description || row.calendar_name,
    slug,
    widgetSlug: slug,
    // Calendar type and event configuration
    calendarType: "event",
    // Use 'event' for standard calendars
    eventType: "RoundRobin_OptimizeForAvailability",
    widgetType: "classic",
    // Visual settings
    eventTitle: "{{contact.name}}",
    eventColor: branding.primaryColor || "#039be5",
    // Time slot configuration
    slotDuration: parseInt(row.slot_interval_minutes) || 30,
    slotDurationUnit: "mins",
    slotInterval: parseInt(row.slot_interval_minutes) || 30,
    slotIntervalUnit: "mins",
    slotBuffer: 0,
    slotBufferUnit: "mins",
    preBuffer: parseInt(row.min_scheduling_notice_days) * 24 || 0,
    preBufferUnit: "hours",
    // Booking limits
    appoinmentPerSlot: 1,
    appoinmentPerDay: parseInt(row.max_bookings_per_day) || 0,
    // 0 means unlimited
    // Booking window
    allowBookingAfter: parseInt(row.min_scheduling_notice_days) * 24 || 0,
    allowBookingAfterUnit: "hours",
    allowBookingFor: parseInt(row.booking_window_days) || 30,
    allowBookingForUnit: "days",
    // Availability hours
    openHours: blocks.map((block) => ({
      daysOfTheWeek: [getDayNumber(block.day)],
      hours: [{
        openHour: parseInt(block.start.split(":")[0]),
        openMinute: parseInt(block.start.split(":")[1]),
        closeHour: parseInt(block.end.split(":")[0]),
        closeMinute: parseInt(block.end.split(":")[1])
      }]
    })),
    // Notifications
    notifications: [{
      type: "email",
      shouldSendToContact: true,
      shouldSendToGuest: false,
      shouldSendToUser: true,
      shouldSendToSelectedUsers: false
    }],
    // Additional settings
    enableRecurring: false,
    autoConfirm: true,
    allowReschedule: true,
    allowCancellation: true,
    shouldAssignContactToTeamMember: false,
    shouldSkipAssigningContactForExisting: false,
    stickyContact: true,
    googleInvitationEmails: false,
    // Form settings
    formSubmitType: "ThankYouMessage",
    formSubmitThanksMessage: branding.buttonText || "Thank you for booking!",
    // Guest settings
    guestType: "count_only",
    // Availability type (0 = custom hours)
    availabilityType: 0
  };
  if (groupId) {
    payload.groupId = groupId;
  }
  return payload;
}
__name(buildCalendarPayload, "buildCalendarPayload");
__name2(buildCalendarPayload, "buildCalendarPayload");
function parseScheduleBlocks(scheduleStr) {
  const blocks = [];
  if (!scheduleStr?.trim()) return blocks;
  const segments = scheduleStr.split(";").map((s) => s.trim());
  for (const segment of segments) {
    if (!segment) continue;
    const match2 = segment.match(/^(\w+)\s+(.+)$/);
    if (!match2) continue;
    const [, dayStr, timeRange] = match2;
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
__name(parseScheduleBlocks, "parseScheduleBlocks");
__name2(parseScheduleBlocks, "parseScheduleBlocks");
function normalizeDay(token) {
  const normalized = token.toLowerCase().trim();
  const dayMap = {
    "mon": "Mon",
    "monday": "Mon",
    "tue": "Tue",
    "tuesday": "Tue",
    "tues": "Tue",
    "wed": "Wed",
    "wednesday": "Wed",
    "thu": "Thu",
    "thursday": "Thu",
    "thur": "Thu",
    "thurs": "Thu",
    "fri": "Fri",
    "friday": "Fri",
    "sat": "Sat",
    "saturday": "Sat",
    "sun": "Sun",
    "sunday": "Sun"
  };
  return dayMap[normalized] || null;
}
__name(normalizeDay, "normalizeDay");
__name2(normalizeDay, "normalizeDay");
function to24h(time) {
  const trimmed = time.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hours, minutes] = trimmed.split(":");
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
  }
  const match12h = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12h) {
    let hours = parseInt(match12h[1], 10);
    const minutes = parseInt(match12h[2] || "0", 10);
    const ampm = match12h[3].toUpperCase();
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      return null;
    }
    if (ampm === "AM" && hours === 12) {
      hours = 0;
    } else if (ampm === "PM" && hours !== 12) {
      hours += 12;
    }
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
  return null;
}
__name(to24h, "to24h");
__name2(to24h, "to24h");
function getDayNumber(dayName) {
  const dayMap = {
    "Sun": 0,
    "Sunday": 0,
    "Mon": 1,
    "Monday": 1,
    "Tue": 2,
    "Tuesday": 2,
    "Wed": 3,
    "Wednesday": 3,
    "Thu": 4,
    "Thursday": 4,
    "Fri": 5,
    "Friday": 5,
    "Sat": 6,
    "Saturday": 6
  };
  return dayMap[dayName] ?? 1;
}
__name(getDayNumber, "getDayNumber");
__name2(getDayNumber, "getDayNumber");
function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
__name(generateId, "generateId");
__name2(generateId, "generateId");
async function ensureGroup(groupName, locationId2, accessToken) {
  try {
    const groupsResponse = await fetch(`https://services.leadconnectorhq.com/calendars/groups?locationId=${locationId2}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json"
      }
    });
    if (groupsResponse.ok) {
      const groupsData = await groupsResponse.json();
      const existingGroup = groupsData.groups?.find((g) => g.name.toLowerCase() === groupName.toLowerCase());
      if (existingGroup) {
        return existingGroup.id;
      }
    }
    const groupData = {
      locationId: locationId2,
      name: groupName,
      description: `Calendar group for ${groupName}`,
      // Add required description field
      slug: slugify(groupName),
      isActive: true
    };
    const createResponse = await fetch("https://services.leadconnectorhq.com/calendars/groups", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(groupData)
    });
    if (!createResponse.ok) {
      const errorData = await createResponse.text();
      console.error("Group creation failed:", createResponse.status, errorData);
      console.error("Group data sent:", JSON.stringify(groupData));
      throw new Error(`Failed to create group: ${createResponse.status} - ${errorData}`);
    }
    const newGroup = await createResponse.json();
    return newGroup.group.id;
  } catch (error) {
    console.error("Error ensuring group:", error);
    throw error;
  }
}
__name(ensureGroup, "ensureGroup");
__name2(ensureGroup, "ensureGroup");
async function createOrUpdateCalendar(payload, accessToken) {
  try {
    console.log("Creating/updating calendar:", payload.name, "with slug:", payload.slug);
    const existingCalendar = await findCalendarBySlug(payload.slug, payload.locationId, accessToken);
    if (existingCalendar) {
      console.log("Calendar already exists with slug:", payload.slug);
      return {
        id: existingCalendar.id,
        isUpdate: true,
        message: "Calendar already exists"
      };
    } else {
      const response = await fetch(`https://services.leadconnectorhq.com/calendars/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Version": "2021-04-15",
          // Use the version from the working sample
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Calendar creation failed:", response.status);
        console.error("Error response:", errorText);
        console.error("Calendar payload sent:", JSON.stringify(payload));
        throw new Error(`GHL API Error ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      console.log("Calendar created successfully:", data);
      return { id: data.id || data.calendar?.id, isUpdate: false };
    }
  } catch (error) {
    console.error("Error creating/updating calendar:", error);
    throw error;
  }
}
__name(createOrUpdateCalendar, "createOrUpdateCalendar");
__name2(createOrUpdateCalendar, "createOrUpdateCalendar");
async function findCalendarBySlug(slug, locationId2, accessToken) {
  try {
    const response = await fetch(`https://services.leadconnectorhq.com/calendars?locationId=${locationId2}`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.calendars?.find((cal) => cal.slug === slug) || null;
  } catch (error) {
    console.error("Error finding calendar by slug:", error);
    return null;
  }
}
__name(findCalendarBySlug, "findCalendarBySlug");
__name2(findCalendarBySlug, "findCalendarBySlug");
async function getLocationToken2(locationId2, env) {
  try {
    console.log("getLocationToken called for:", locationId2);
    const result = await env.DB.prepare(`
      SELECT access_token, refresh_token, expires_at, tenant_id 
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId2).first();
    console.log("Token query result:", result ? "found" : "not found");
    if (!result) {
      console.log("No token in database for location:", locationId2);
      return null;
    }
    const now = Math.floor(Date.now() / 1e3);
    console.log("Token expires at:", result.expires_at, "Current time:", now);
    if (result.expires_at <= now) {
      console.warn("Token expired for location:", locationId2);
      return null;
    }
    console.log("Attempting to decrypt token...");
    const accessToken = await decryptToken3(result.access_token, env.ENCRYPTION_KEY);
    console.log("Token decrypted successfully");
    return {
      accessToken,
      refreshToken: result.refresh_token,
      expiresAt: result.expires_at,
      tenantId: result.tenant_id
    };
  } catch (error) {
    console.error("Error getting location token:", error);
    return null;
  }
}
__name(getLocationToken2, "getLocationToken2");
__name2(getLocationToken2, "getLocationToken");
async function decryptToken3(encryptedToken, encryptionKey) {
  try {
    const [encryptedData, ivData] = encryptedToken.split(":");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const encrypted = new Uint8Array(atob(encryptedData).split("").map((char) => char.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivData).split("").map((char) => char.charCodeAt(0)));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt token");
  }
}
__name(decryptToken3, "decryptToken3");
__name2(decryptToken3, "decryptToken");
async function onRequest7(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const locationId2 = url.searchParams.get("locationId");
    if (!locationId2) {
      return new Response(JSON.stringify({
        error: "locationId parameter is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const locationResult = await env.DB.prepare(`
      SELECT time_zone FROM locations WHERE id = ?
    `).bind(locationId2).first();
    if (locationResult) {
      return new Response(JSON.stringify({
        timeZone: locationResult.time_zone
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const tokenData = await getLocationToken3(locationId2, env);
    if (!tokenData) {
      return new Response(JSON.stringify({
        timeZone: "America/New_York"
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const ghlResponse = await fetch(`https://services.leadconnectorhq.com/locations/${locationId2}`, {
      headers: {
        "Authorization": `Bearer ${tokenData.accessToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json"
      }
    });
    if (!ghlResponse.ok) {
      console.error("GHL API error:", await ghlResponse.text());
      return new Response(JSON.stringify({
        timeZone: "America/New_York"
        // Fallback
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const locationData = await ghlResponse.json();
    const timeZone = locationData.location?.timezone || "America/New_York";
    try {
      await env.DB.prepare(`
        UPDATE locations SET time_zone = ? WHERE id = ?
      `).bind(timeZone, locationId2).run();
    } catch (error) {
      console.warn("Failed to update location timezone in database:", error);
    }
    return new Response(JSON.stringify({
      timeZone
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Location timezone API error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest7, "onRequest7");
__name2(onRequest7, "onRequest");
async function getLocationToken3(locationId2, env) {
  try {
    const result = await env.DB.prepare(`
      SELECT access_token, refresh_token, expires_at 
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId2).first();
    if (!result) {
      return null;
    }
    const now = Math.floor(Date.now() / 1e3);
    if (result.expires_at <= now) {
      console.warn("Token expired for location:", locationId2);
      return null;
    }
    const accessToken = await decryptToken4(result.access_token, env.ENCRYPTION_KEY);
    return {
      accessToken,
      refreshToken: result.refresh_token,
      expiresAt: result.expires_at
    };
  } catch (error) {
    console.error("Error getting location token:", error);
    return null;
  }
}
__name(getLocationToken3, "getLocationToken3");
__name2(getLocationToken3, "getLocationToken");
async function decryptToken4(encryptedToken, encryptionKey) {
  try {
    const [encryptedData, ivData] = encryptedToken.split(":");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const encrypted = new Uint8Array(atob(encryptedData).split("").map((char) => char.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivData).split("").map((char) => char.charCodeAt(0)));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt token");
  }
}
__name(decryptToken4, "decryptToken4");
__name2(decryptToken4, "decryptToken");
async function onRequest8(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders
    });
  }
  try {
    const result = await env.DB.prepare(`
      SELECT id, name, time_zone, is_enabled 
      FROM locations 
      WHERE is_enabled = 1
      ORDER BY name
    `).all();
    const locations = result.results || [];
    return new Response(JSON.stringify({
      success: true,
      locations
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Locations API error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest8, "onRequest8");
__name2(onRequest8, "onRequest");
async function onRequest9(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const locationId2 = url.searchParams.get("locationId") || "EnUqtThIwW8pdTLOvuO7";
    const tokenData = await getLocationToken4(locationId2, env);
    if (!tokenData) {
      return new Response(JSON.stringify({
        error: "No token found",
        locationId: locationId2
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    const testEndpoints = [
      {
        name: "Get Location Info",
        url: `https://services.leadconnectorhq.com/locations/${locationId2}`,
        method: "GET"
      },
      {
        name: "List Calendars",
        url: `https://services.leadconnectorhq.com/calendars/?locationId=${locationId2}`,
        method: "GET"
      },
      {
        name: "List Calendars with showDrafted",
        url: `https://services.leadconnectorhq.com/calendars/?locationId=${locationId2}&showDrafted=true`,
        method: "GET"
      }
    ];
    const results = [];
    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            "Authorization": `Bearer ${tokenData.accessToken}`,
            "Version": "2021-07-28",
            "Content-Type": "application/json"
          }
        });
        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }
        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: response.status,
          success: response.ok,
          data: response.ok ? responseData : null,
          error: !response.ok ? responseData : null
        });
        console.log(`${endpoint.name} result:`, response.status, response.ok ? "SUCCESS" : "FAILED");
      } catch (error) {
        results.push({
          endpoint: endpoint.name,
          url: endpoint.url,
          status: "ERROR",
          success: false,
          error: error.message
        });
        console.error(`${endpoint.name} error:`, error);
      }
    }
    return new Response(JSON.stringify({
      locationId: locationId2,
      tokenFound: true,
      tokenExpiry: tokenData.expiresAt,
      currentTime: Math.floor(Date.now() / 1e3),
      results
    }, null, 2), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (error) {
    console.error("Test auth error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest9, "onRequest9");
__name2(onRequest9, "onRequest");
async function getLocationToken4(locationId2, env) {
  try {
    const result = await env.DB.prepare(`
      SELECT access_token, refresh_token, expires_at 
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId2).first();
    if (!result) {
      return null;
    }
    const now = Math.floor(Date.now() / 1e3);
    if (result.expires_at <= now) {
      console.warn("Token expired for location:", locationId2, "- attempting to refresh...");
      try {
        const refreshToken = await decryptToken5(result.refresh_token, env.ENCRYPTION_KEY);
        const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: env.HL_CLIENT_ID,
            client_secret: env.HL_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            user_type: "Location"
          }).toString()
        });
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error("Token refresh failed:", tokenResponse.status, errorText);
          return null;
        }
        const newTokenData = await tokenResponse.json();
        console.log("Token refreshed successfully");
        const encryptedTokens = await encryptTokens3({
          accessToken: newTokenData.access_token,
          refreshToken: newTokenData.refresh_token || refreshToken
        }, env.ENCRYPTION_KEY);
        await env.DB.prepare(`
          UPDATE tokens 
          SET access_token = ?, 
              refresh_token = ?,
              expires_at = ?
          WHERE location_id = ?
        `).bind(
          encryptedTokens.accessToken,
          encryptedTokens.refreshToken,
          Math.floor((Date.now() + newTokenData.expires_in * 1e3) / 1e3),
          locationId2
        ).run();
        console.log("Token refreshed and updated in database for location:", locationId2);
        return {
          accessToken: newTokenData.access_token,
          refreshToken: newTokenData.refresh_token || refreshToken,
          expiresAt: Math.floor((Date.now() + newTokenData.expires_in * 1e3) / 1e3)
        };
      } catch (refreshError) {
        console.error("Failed to refresh token:", refreshError);
        return null;
      }
    }
    const accessToken = await decryptToken5(result.access_token, env.ENCRYPTION_KEY);
    return {
      accessToken,
      refreshToken: result.refresh_token,
      expiresAt: result.expires_at
    };
  } catch (error) {
    console.error("Error getting location token:", error);
    return null;
  }
}
__name(getLocationToken4, "getLocationToken4");
__name2(getLocationToken4, "getLocationToken");
async function decryptToken5(encryptedToken, encryptionKey) {
  try {
    const [encryptedData, ivData] = encryptedToken.split(":");
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    const encrypted = new Uint8Array(atob(encryptedData).split("").map((char) => char.charCodeAt(0)));
    const iv = new Uint8Array(atob(ivData).split("").map((char) => char.charCodeAt(0)));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt token");
  }
}
__name(decryptToken5, "decryptToken5");
__name2(decryptToken5, "decryptToken");
async function encryptTokens3(tokens, encryptionKey) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedAccessToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: accessTokenIv },
      key,
      new TextEncoder().encode(tokens.accessToken)
    );
    const refreshTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedRefreshToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: refreshTokenIv },
      key,
      new TextEncoder().encode(tokens.refreshToken)
    );
    return {
      accessToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedAccessToken)))}:${btoa(String.fromCharCode(...accessTokenIv))}`,
      refreshToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedRefreshToken)))}:${btoa(String.fromCharCode(...refreshTokenIv))}`
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt tokens");
  }
}
__name(encryptTokens3, "encryptTokens3");
__name2(encryptTokens3, "encryptTokens");
async function onRequest10(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const locationId2 = url.searchParams.get("locationId");
    const forceExpire = url.searchParams.get("forceExpire") === "true";
    if (!locationId2) {
      return new Response(JSON.stringify({
        error: "locationId parameter is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    console.log("=== TOKEN VALIDATION TEST ===");
    console.log("Location ID:", locationId2);
    console.log("Force Expire:", forceExpire);
    const tokenRecord = await env.DB.prepare(`
      SELECT id, access_token, refresh_token, expires_at, location_id
      FROM tokens 
      WHERE location_id = ? 
      ORDER BY expires_at DESC 
      LIMIT 1
    `).bind(locationId2).first();
    if (!tokenRecord) {
      console.log("\u274C No token found in database for location:", locationId2);
      return new Response(JSON.stringify({
        success: false,
        step: "database_check",
        message: "No token found in database",
        locationId: locationId2
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
    console.log("\u2705 Token found in database");
    console.log("Token ID:", tokenRecord.id);
    console.log("Expires at:", new Date(tokenRecord.expires_at * 1e3).toISOString());
    const now = Math.floor(Date.now() / 1e3);
    const isExpired = tokenRecord.expires_at <= now;
    const expiresIn = tokenRecord.expires_at - now;
    console.log("Current time:", new Date(now * 1e3).toISOString());
    console.log("Token expired?", isExpired);
    console.log("Expires in (seconds):", expiresIn);
    if (forceExpire && !isExpired) {
      console.log("\u26A0\uFE0F Force expiring token for testing...");
      await env.DB.prepare(`
        UPDATE tokens 
        SET expires_at = ?
        WHERE id = ?
      `).bind(
        now - 3600,
        // Set to 1 hour ago
        tokenRecord.id
      ).run();
      tokenRecord.expires_at = now - 3600;
    }
    if (tokenRecord.expires_at <= now) {
      console.log("\u{1F504} Token is expired, attempting refresh...");
      try {
        const refreshToken = await decryptToken6(tokenRecord.refresh_token, env.ENCRYPTION_KEY);
        console.log("\u2705 Refresh token decrypted successfully");
        const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: env.HL_CLIENT_ID,
            client_secret: env.HL_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            user_type: "Location"
          }).toString()
        });
        console.log("Refresh API response status:", tokenResponse.status);
        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error("\u274C Token refresh failed:", errorText);
          return new Response(JSON.stringify({
            success: false,
            step: "token_refresh",
            message: "Failed to refresh token",
            error: errorText,
            status: tokenResponse.status
          }), {
            status: 502,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
        const newTokenData = await tokenResponse.json();
        console.log("\u2705 Token refreshed successfully");
        console.log("New token expires in:", newTokenData.expires_in, "seconds");
        const encryptedTokens = await encryptTokens4({
          accessToken: newTokenData.access_token,
          refreshToken: newTokenData.refresh_token || refreshToken
        }, env.ENCRYPTION_KEY);
        const newExpiresAt = Math.floor((Date.now() + newTokenData.expires_in * 1e3) / 1e3);
        await env.DB.prepare(`
          UPDATE tokens 
          SET access_token = ?, 
              refresh_token = ?,
              expires_at = ?
          WHERE id = ?
        `).bind(
          encryptedTokens.accessToken,
          encryptedTokens.refreshToken,
          newExpiresAt,
          tokenRecord.id
        ).run();
        console.log("\u2705 Database updated with new token");
        const testResponse = await fetch(`https://services.leadconnectorhq.com/calendars?locationId=${locationId2}`, {
          headers: {
            "Authorization": `Bearer ${newTokenData.access_token}`,
            "Version": "2021-07-28",
            "Content-Type": "application/json"
          }
        });
        console.log("Test API call with new token:", testResponse.status);
        return new Response(JSON.stringify({
          success: true,
          message: "Token was expired and successfully refreshed",
          tokenStatus: {
            wasExpired: true,
            refreshed: true,
            newExpiresAt: new Date(newExpiresAt * 1e3).toISOString(),
            testApiCall: testResponse.ok ? "success" : "failed"
          }
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      } catch (refreshError) {
        console.error("\u274C Error during refresh process:", refreshError);
        return new Response(JSON.stringify({
          success: false,
          step: "refresh_error",
          message: "Error during refresh process",
          error: refreshError.message
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }
    console.log("\u2705 Token is valid, testing API call...");
    try {
      const accessToken = await decryptToken6(tokenRecord.access_token, env.ENCRYPTION_KEY);
      const testResponse = await fetch(`https://services.leadconnectorhq.com/calendars?locationId=${locationId2}`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Version": "2021-07-28",
          "Content-Type": "application/json"
        }
      });
      console.log("Test API call status:", testResponse.status);
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.error("API call failed:", errorText);
        return new Response(JSON.stringify({
          success: false,
          message: "Token exists but API call failed",
          tokenStatus: {
            wasExpired: false,
            expiresIn,
            apiError: errorText,
            apiStatus: testResponse.status
          }
        }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
      const calendarsData = await testResponse.json();
      return new Response(JSON.stringify({
        success: true,
        message: "Token is valid and working",
        tokenStatus: {
          wasExpired: false,
          expiresAt: new Date(tokenRecord.expires_at * 1e3).toISOString(),
          expiresIn: `${Math.floor(expiresIn / 3600)} hours ${Math.floor(expiresIn % 3600 / 60)} minutes`,
          testApiCall: "success",
          calendarsFound: calendarsData.calendars?.length || 0
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    } catch (error) {
      console.error("\u274C Error testing token:", error);
      return new Response(JSON.stringify({
        success: false,
        step: "token_test",
        message: "Error testing token",
        error: error.message
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  } catch (error) {
    console.error("\u274C General error:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
}
__name(onRequest10, "onRequest10");
__name2(onRequest10, "onRequest");
async function decryptToken6(encryptedToken, encryptionKey) {
  const [encryptedData, ivData] = encryptedToken.split(":");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(encryptionKey.substring(0, 32)),
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
  const encrypted = new Uint8Array(atob(encryptedData).split("").map((char) => char.charCodeAt(0)));
  const iv = new Uint8Array(atob(ivData).split("").map((char) => char.charCodeAt(0)));
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );
  return new TextDecoder().decode(decrypted);
}
__name(decryptToken6, "decryptToken6");
__name2(decryptToken6, "decryptToken");
async function encryptTokens4(tokens, encryptionKey) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(encryptionKey.substring(0, 32)),
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedAccessToken = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: accessTokenIv },
    key,
    new TextEncoder().encode(tokens.accessToken)
  );
  const refreshTokenIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedRefreshToken = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: refreshTokenIv },
    key,
    new TextEncoder().encode(tokens.refreshToken)
  );
  return {
    accessToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedAccessToken)))}:${btoa(String.fromCharCode(...accessTokenIv))}`,
    refreshToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedRefreshToken)))}:${btoa(String.fromCharCode(...refreshTokenIv))}`
  };
}
__name(encryptTokens4, "encryptTokens4");
__name2(encryptTokens4, "encryptTokens");
async function onRequest11(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    console.log("Simple OAuth callback - Code received:", code ? "YES" : "NO");
    console.log("Full callback URL:", request.url);
    if (!code) {
      return new Response(`
        <!DOCTYPE html>
        <html><body>
          <h1>Authorization Error</h1>
          <p>No authorization code received.</p>
        </body></html>
      `, { status: 400, headers: { "Content-Type": "text/html" } });
    }
    console.log("Exchanging code for token with params:", {
      client_id: env.HL_CLIENT_ID,
      redirect_uri: env.OAUTH_REDIRECT_URL,
      code_length: code.length
    });
    const tokenResponse = await fetch("https://services.leadconnectorhq.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.HL_CLIENT_ID,
        client_secret: env.HL_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: env.OAUTH_REDIRECT_URL,
        user_type: "Location"
      }).toString()
    });
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", tokenResponse.status, errorText);
      let errorMessage = `Status: ${tokenResponse.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error_description || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      return new Response(`
        <!DOCTYPE html>
        <html><body>
          <h1>Token Exchange Failed</h1>
          <p>Error: ${errorMessage}</p>
          <p><small>Please ensure you have authorized the application and try again.</small></p>
          <p><a href="/">Return to EasyCal</a></p>
        </body></html>
      `, { status: 400, headers: { "Content-Type": "text/html" } });
    }
    const tokenData = await tokenResponse.json();
    console.log("Token received - keys:", Object.keys(tokenData));
    console.log("Full token data:", tokenData);
    const locationId2 = tokenData.locationId;
    const userType = tokenData.userType;
    const companyId2 = tokenData.companyId;
    const isBulkInstallation = tokenData.isBulkInstallation;
    console.log("Token exchange successful:", {
      userType,
      locationId: locationId2,
      companyId: companyId2,
      isBulkInstallation
    });
    if (!locationId2 && (userType === "Company" || isBulkInstallation)) {
      console.log("Agency/bulk installation detected - storing agency token for later location selection");
      const tenantId2 = `tenant_${Date.now()}`;
      await env.DB.prepare(`
        INSERT OR REPLACE INTO tenants (id, created_at, name, install_context, agency_id)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        tenantId2,
        Math.floor(Date.now() / 1e3),
        "Agency Installation",
        "agency",
        companyId2
      ).run();
      const encryptedTokens2 = await encryptTokens5({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token
      }, env.ENCRYPTION_KEY);
      const tokenId2 = `token_${Date.now()}`;
      await env.DB.prepare(`
        INSERT OR REPLACE INTO tokens (id, tenant_id, location_id, access_token, refresh_token, scope, expires_at, user_type, company_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tokenId2,
        tenantId2,
        null,
        // No specific location for agency tokens
        encryptedTokens2.accessToken,
        encryptedTokens2.refreshToken,
        tokenData.scope,
        Math.floor((Date.now() + tokenData.expires_in * 1e3) / 1e3),
        userType,
        companyId2
      ).run();
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Installation Complete</title>
          <script>
            window.location.href = '/?companyId=${companyId2}&userType=agency';
          <\/script>
        </head>
        <body>
          <h1>\u2713 EasyCal Installed Successfully!</h1>
          <p>Agency-level installation complete! Redirecting...</p>
          <a href="/?companyId=${companyId2}&userType=agency">Go to EasyCal</a>
        </body>
        </html>
      `, {
        status: 200,
        headers: { "Content-Type": "text/html" }
      });
    }
    if (!locationId2) {
      console.error("No location ID found in token response");
      return new Response(`
        <!DOCTYPE html>
        <html><body>
          <h1>Installation Error</h1>
          <p>Unable to determine location context. Please try installing from within a specific location.</p>
        </body></html>
      `, { status: 400, headers: { "Content-Type": "text/html" } });
    }
    const tenantId = `tenant_${Date.now()}`;
    const installContext = "location";
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tenants (id, created_at, name, install_context, agency_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      tenantId,
      Math.floor(Date.now() / 1e3),
      "Location Installation",
      installContext,
      companyId2
    ).run();
    await env.DB.prepare(`
      INSERT OR REPLACE INTO locations (id, tenant_id, name, time_zone, is_enabled)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      locationId2,
      tenantId,
      "Location Installation",
      "America/New_York",
      1
    ).run();
    const encryptedTokens = await encryptTokens5({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token
    }, env.ENCRYPTION_KEY);
    const tokenId = `token_${Date.now()}`;
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tokens (id, tenant_id, location_id, access_token, refresh_token, scope, expires_at, user_type, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tokenId,
      tenantId,
      locationId2,
      encryptedTokens.accessToken,
      encryptedTokens.refreshToken,
      tokenData.scope,
      Math.floor((Date.now() + tokenData.expires_in * 1e3) / 1e3),
      userType,
      companyId2
    ).run();
    console.log("Installation completed:", {
      locationId: locationId2,
      userType,
      companyId: companyId2,
      installContext
    });
    const redirectUrl = `/?locationId=${locationId2}`;
    const successMessage = "Installation complete! You can now manage calendars for this location.";
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installation Complete</title>
        <script>
          window.location.href = '${redirectUrl}';
        <\/script>
      </head>
      <body>
        <h1>\u2713 EasyCal Installed Successfully!</h1>
        <p>${successMessage}</p>
        <p>Redirecting to your calendar manager...</p>
        <a href="${redirectUrl}">Go to EasyCal</a>
      </body>
      </html>
    `, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response(`
      <!DOCTYPE html>
      <html><body>
        <h1>Installation Error</h1>
        <p>Error: ${error.message}</p>
      </body></html>
    `, { status: 500, headers: { "Content-Type": "text/html" } });
  }
}
__name(onRequest11, "onRequest11");
__name2(onRequest11, "onRequest");
async function encryptTokens5(tokens, encryptionKey) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedAccessToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: accessTokenIv },
      key,
      new TextEncoder().encode(tokens.accessToken)
    );
    const refreshTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedRefreshToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: refreshTokenIv },
      key,
      new TextEncoder().encode(tokens.refreshToken)
    );
    return {
      accessToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedAccessToken)))}:${btoa(String.fromCharCode(...accessTokenIv))}`,
      refreshToken: `${btoa(String.fromCharCode(...new Uint8Array(encryptedRefreshToken)))}:${btoa(String.fromCharCode(...refreshTokenIv))}`
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt tokens");
  }
}
__name(encryptTokens5, "encryptTokens5");
__name2(encryptTokens5, "encryptTokens");
async function onRequest12(context) {
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const locationId2 = url.searchParams.get("locationId");
    const companyId2 = url.searchParams.get("companyId");
    console.log("OAuth callback received:", {
      code: code ? "present" : "missing",
      state,
      locationIdFromURL: locationId2,
      companyIdFromURL: companyId2,
      fullURL: request.url
    });
    if (!code) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Error</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Authorization Error</h1>
            <p>No authorization code received.</p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { "Content-Type": "text/html" }
      });
    }
    const tokenResponse = await exchangeCodeForTokens(code, env);
    if (!tokenResponse.success) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Error</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Authorization Error</h1>
            <p>Failed to exchange authorization code: ${tokenResponse.error}</p>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { "Content-Type": "text/html" }
      });
    }
    const installResult = await completeInstallation(tokenResponse.data, env);
    if (!installResult.success) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Installation Error</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 50px; }
            .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>Installation Error</h1>
            <p>Failed to complete installation: ${installResult.error}</p>
          </div>
        </body>
        </html>
      `, {
        status: 500,
        headers: { "Content-Type": "text/html" }
      });
    }
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installation Complete</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .success { color: #059669; background: #f0fdf4; padding: 20px; border-radius: 8px; }
          .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
        <script>
          // Auto-redirect immediately to the app with location context
          window.location.href = '/?locationId=${installResult.locationId}';
        <\/script>
      </head>
      <body>
        <div class="success">
          <h1>\u2713 EasyCal Installed Successfully!</h1>
          <p>Your GoHighLevel account is now connected to EasyCal.</p>
          <p><strong>Location:</strong> ${installResult.locationName}</p>
          <p>Redirecting to your calendar manager...</p>
          <a href="/?locationId=${installResult.locationId}" class="btn">Go to EasyCal</a>
        </div>
      </body>
      </html>
    `, {
      status: 200,
      headers: { "Content-Type": "text/html" }
    });
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Callback Error</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; }
          .error { color: #dc2626; background: #fef2f2; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>Callback Error</h1>
          <p>${error.message}</p>
        </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: { "Content-Type": "text/html" }
    });
  }
}
__name(onRequest12, "onRequest12");
__name2(onRequest12, "onRequest");
async function exchangeCodeForTokens(code, env) {
  try {
    const tokenRequest = {
      client_id: env.HL_CLIENT_ID,
      client_secret: env.HL_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: env.OAUTH_REDIRECT_URL
    };
    console.log("Exchanging code for tokens...");
    const response = await fetch("https://services.leadconnectorhq.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(tokenRequest).toString()
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token exchange failed:", response.status, errorText);
      return { success: false, error: `Token exchange failed: ${response.status}` };
    }
    const tokenData = await response.json();
    console.log("Token exchange successful");
    console.log("Full token response:", JSON.stringify(tokenData, null, 2));
    return { success: true, data: tokenData };
  } catch (error) {
    console.error("Token exchange error:", error);
    return { success: false, error: error.message };
  }
}
__name(exchangeCodeForTokens, "exchangeCodeForTokens");
__name2(exchangeCodeForTokens, "exchangeCodeForTokens");
async function completeInstallation(tokenData, env) {
  try {
    const scopes = tokenData.scope ? tokenData.scope.split(" ") : [];
    console.log("Token scopes:", scopes);
    console.log("Token data keys:", Object.keys(tokenData));
    let extractedLocationId = locationId || // From callback URL
    companyId || // From callback URL (agency)
    tokenData.location_id || tokenData.locationId || tokenData.companyId || tokenData.sub;
    console.log("Location ID extraction results:", {
      fromCallbackURL: locationId,
      fromCompanyId: companyId,
      fromTokenData: {
        location_id: tokenData.location_id,
        locationId: tokenData.locationId,
        companyId: tokenData.companyId,
        sub: tokenData.sub
      },
      finalExtracted: extractedLocationId
    });
    if (!extractedLocationId || extractedLocationId.startsWith("temp_")) {
      console.error("No valid location ID found in OAuth flow! Using fallback.");
      extractedLocationId = "HgTZdA5INm0uiGh9KvHC";
      console.log("Using fallback location ID:", extractedLocationId);
    }
    if (!extractedLocationId) {
      throw new Error("Failed to determine location ID for installation");
    }
    const locationName = tokenData.name || tokenData.companyName || tokenData.businessName || "New Installation";
    const isAgencyInstall = scopes.includes("oauth.readonly") && scopes.includes("oauth.write");
    console.log("Extracted location info:", {
      locationId: extractedLocationId,
      locationName,
      isAgencyInstall,
      tokenDataKeys: Object.keys(tokenData),
      fullTokenData: tokenData
    });
    console.log("Checking all possible location ID fields:", {
      "tokenData.location_id": tokenData.location_id,
      "tokenData.locationId": tokenData.locationId,
      "tokenData.companyId": tokenData.companyId,
      "tokenData.company_id": tokenData.company_id,
      "tokenData.sub": tokenData.sub,
      "tokenData.aud": tokenData.aud,
      "tokenData.scope": tokenData.scope
    });
    const tenantId = generateId2();
    const tenantData = {
      id: tenantId,
      name: locationName,
      installContext: isAgencyInstall ? "agency" : "location",
      agencyId: isAgencyInstall ? tokenData.companyId || extractedLocationId : null,
      createdAt: Math.floor(Date.now() / 1e3)
    };
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tenants (id, created_at, name, install_context, agency_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      tenantData.id,
      tenantData.createdAt,
      tenantData.name,
      tenantData.installContext,
      tenantData.agencyId
    ).run();
    const locationData = {
      id: extractedLocationId,
      tenantId,
      name: locationName,
      timeZone: tokenData.timezone || "America/New_York",
      isEnabled: true
    };
    await env.DB.prepare(`
      INSERT OR REPLACE INTO locations (id, tenant_id, name, time_zone, is_enabled)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      locationData.id,
      locationData.tenantId,
      locationData.name,
      locationData.timeZone,
      locationData.isEnabled ? 1 : 0
    ).run();
    const encryptedTokens = await encryptTokens6({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1e3
    }, env.ENCRYPTION_KEY);
    const tokenId = generateId2();
    await env.DB.prepare(`
      INSERT OR REPLACE INTO tokens (id, tenant_id, location_id, access_token, refresh_token, scope, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      tokenId,
      tenantId,
      extractedLocationId,
      // Use the properly extracted location ID
      encryptedTokens.accessToken,
      encryptedTokens.refreshToken,
      tokenData.scope,
      Math.floor((Date.now() + tokenData.expires_in * 1e3) / 1e3)
    ).run();
    console.log("Installation completed successfully");
    return {
      success: true,
      locationId: extractedLocationId,
      locationName,
      tenantId
    };
  } catch (error) {
    console.error("Installation error:", error);
    return { success: false, error: error.message };
  }
}
__name(completeInstallation, "completeInstallation");
__name2(completeInstallation, "completeInstallation");
function generateId2() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
__name(generateId2, "generateId2");
__name2(generateId2, "generateId");
async function encryptTokens6(tokens, encryptionKey) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(encryptionKey.substring(0, 32)),
      // Ensure 32 bytes
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
    const accessTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const accessTokenBuffer = new TextEncoder().encode(tokens.accessToken);
    const encryptedAccessToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: accessTokenIv },
      key,
      accessTokenBuffer
    );
    const refreshTokenIv = crypto.getRandomValues(new Uint8Array(12));
    const refreshTokenBuffer = new TextEncoder().encode(tokens.refreshToken);
    const encryptedRefreshToken = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: refreshTokenIv },
      key,
      refreshTokenBuffer
    );
    const accessTokenB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedAccessToken)));
    const accessTokenIvB64 = btoa(String.fromCharCode(...accessTokenIv));
    const refreshTokenB64 = btoa(String.fromCharCode(...new Uint8Array(encryptedRefreshToken)));
    const refreshTokenIvB64 = btoa(String.fromCharCode(...refreshTokenIv));
    return {
      accessToken: `${accessTokenB64}:${accessTokenIvB64}`,
      refreshToken: `${refreshTokenB64}:${refreshTokenIvB64}`
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt tokens");
  }
}
__name(encryptTokens6, "encryptTokens6");
__name2(encryptTokens6, "encryptTokens");
async function onRequest13(context) {
  const { request } = context;
  try {
    const url = new URL(request.url);
    console.log("Auth install called with URL:", request.url);
    console.log("Method:", request.method);
    const installType = url.searchParams.get("type") || "location";
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const scopes = [
      "calendars.readonly",
      "calendars.write",
      "calendars/groups.write",
      "calendars/groups.readonly",
      "calendars/events.readonly",
      "calendars/events.write",
      "locations.readonly",
      "locations.write",
      "locations/customFields.readonly",
      "locations/customFields.write"
    ];
    if (installType === "agency") {
      scopes.push("oauth.readonly", "oauth.write");
    }
    const baseUrl = "https://marketplace.gohighlevel.com/oauth/chooselocation";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: "68b96169e165955a7edc20b3-mf58ywbo",
      redirect_uri: "https://easycal.enrollio.ai/auth/callback",
      scope: scopes.join(" "),
      state
    });
    if (installType === "agency") {
      params.set("user_type", "Company");
    }
    const authUrl = `${baseUrl}?${params.toString()}`;
    console.log("Generated auth URL:", authUrl);
    return Response.redirect(authUrl, 302);
  } catch (error) {
    console.error("Auth install error:", error);
    return new Response(JSON.stringify({
      error: error.message,
      status: "error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
__name(onRequest13, "onRequest13");
__name2(onRequest13, "onRequest");
var routes = [
  {
    routePath: "/api/settings/defaults",
    mountPath: "/api/settings",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/brand-config",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/calendars",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/api/debug-token",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest4]
  },
  {
    routePath: "/api/detect-location",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest5]
  },
  {
    routePath: "/api/import-calendars",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest6]
  },
  {
    routePath: "/api/location-timezone",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest7]
  },
  {
    routePath: "/api/locations",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest8]
  },
  {
    routePath: "/api/test-auth",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest9]
  },
  {
    routePath: "/api/validate-token",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest10]
  },
  {
    routePath: "/auth/callback",
    mountPath: "/auth",
    method: "",
    middlewares: [],
    modules: [onRequest11]
  },
  {
    routePath: "/auth/callback-old",
    mountPath: "/auth",
    method: "",
    middlewares: [],
    modules: [onRequest12]
  },
  {
    routePath: "/auth/install",
    mountPath: "/auth",
    method: "",
    middlewares: [],
    modules: [onRequest13]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-lDZBDJ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../../../../opt/homebrew/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-lDZBDJ/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.3011594099259315.js.map
