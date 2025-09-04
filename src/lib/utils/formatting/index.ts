import { BrandConfig, CalendarDefaults, ScheduleBlock } from '@/types/brand';

/**
 * Create a URL-friendly slug from a string
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Parse schedule blocks from CSV format
 * Format: "Day HH:MM-HH:MM; Day HH:MM-HH:MM; ..."
 * Days: Mon, Tue, Wed, Thu, Fri, Sat, Sun (case-insensitive)
 * Times: Support both 12-hour (3:00 PM) and 24-hour (15:00) formats
 */
export function parseScheduleBlocks(input: string): ScheduleBlock[] {
  if (!input || input.trim() === '') {
    return [];
  }

  const blocks: ScheduleBlock[] = [];
  const segments = input.split(';').map(s => s.trim()).filter(s => s);

  for (const segment of segments) {
    try {
      // Parse format: "Day HH:MM-HH:MM"
      const match = segment.match(/^(\w+)\s+(.+)$/);
      if (!match) {
        console.warn(`Invalid schedule block format: ${segment}`);
        continue;
      }

      const [, dayStr, timeRange] = match;
      const day = dayStr ? normalizeDay(dayStr) : null;
      
      if (!day) {
        console.warn(`Invalid day: ${dayStr}`);
        continue;
      }

      // Parse time range
      const timeMatch = timeRange?.match(/^(.+?)-(.+?)$/);
      if (!timeMatch) {
        console.warn(`Invalid time range format: ${timeRange}`);
        continue;
      }

      const [, startTime, endTime] = timeMatch;
      const start = startTime ? to24h(startTime.trim()) : null;
      const end = endTime ? to24h(endTime.trim()) : null;

      if (!start || !end) {
        console.warn(`Invalid time format in: ${timeRange}`);
        continue;
      }

      blocks.push({ day, start, end });
    } catch (error) {
      console.warn(`Error parsing schedule block "${segment}":`, error);
    }
  }

  return blocks;
}

/**
 * Normalize time string to 24-hour format
 * @param time - Time string to normalize
 * @returns Normalized time string or original if already valid
 */
export function normalizeTime(time: string): string {
  return to24h(time) || time;
}

/**
 * Normalize day names to standard 3-letter format
 */
export function normalizeDay(token: string): "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun" | null {
  const normalized = token.toLowerCase().trim();
  
  const dayMap: Record<string, "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"> = {
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

/**
 * Convert time string to 24-hour format (HH:MM)
 * Supports both 12-hour (3:00 PM, 3PM) and 24-hour (15:00) formats
 */
export function to24h(time: string): string | null {
  const trimmed = time.trim();
  
  // Check if it's already in 24-hour format
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    const [hours, minutes] = trimmed.split(':');
    const h = parseInt(hours || '0', 10);
    const m = parseInt(minutes || '0', 10);
    
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  }
  
  // Parse 12-hour format
  const match12h = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12h) {
    let hours = parseInt(match12h[1] || '0', 10);
    const minutes = parseInt(match12h[2] || '0', 10);
    const ampm = match12h[3]?.toUpperCase();
    
    if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
      return null;
    }
    
    // Convert to 24-hour
    if (ampm === 'AM' && hours === 12) {
      hours = 0;
    } else if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  return null;
}

/**
 * Get location timezone from GHL API
 */
export async function getLocationTimezone(locationId: string): Promise<string> {
  try {
    const response = await fetch(`/api/location-timezone?locationId=${locationId}`);
    if (response.ok) {
      const data = await response.json();
      return data.timeZone || 'America/New_York';
    }
  } catch (error) {
    console.error('Error fetching location timezone:', error);
  }
  
  // Fallback to Eastern Time
  return 'America/New_York';
}

/**
 * Apply branding with proper precedence
 * CSV row overrides → Brand config → defaults
 */
export function applyBranding(
  row: any, 
  brand: BrandConfig, 
  defaults?: CalendarDefaults, 
  locationTz?: string
): {
  primary: string;
  background: string;
  button: string;
  timezone: string;
} {
  // Primary color precedence
  const primary = row.primary_color_hex || brand.primaryColorHex;
  
  // Background color precedence  
  const background = row.background_color_hex || brand.backgroundColorHex;
  
  // Button text precedence with special handling for makeup calendars
  let button = row.button_text;
  if (!button) {
    if (row.calendar_purpose === 'makeup') {
      button = 'Schedule Make-Up';
    } else {
      button = brand.defaultButtonText;
    }
  }
  
  // Timezone precedence: CSV → Brand → Defaults → Location
  const timezone = row.timezone || 
                  brand.defaultTimezone || 
                  defaults?.defaultTimezone || 
                  locationTz || 
                  'America/New_York';
  
  return { primary, background, button, timezone };
}

/**
 * Ensure a calendar group exists, create if needed
 * Returns the group ID
 */
export async function ensureGroup(name: string, locationId: string): Promise<string> {
  // TODO: Implement GHL API call to create/get group
  // For now, return a placeholder
  return `group-${slugify(name)}`;
}

/**
 * Generate unique slug by checking existing calendars and appending numbers if needed
 */
export function uniquifySlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 2;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Validate timezone string using Intl API
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get common timezone options for dropdowns
 */
export function getCommonTimezones(): Array<{ value: string; label: string }> {
  return [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
    { value: 'Europe/London', label: 'London Time (GMT)' },
    { value: 'Europe/Paris', label: 'Paris Time (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo Time (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai Time (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney Time (AEDT)' },
    { value: 'Australia/Melbourne', label: 'Melbourne Time (AEDT)' },
  ];
}
