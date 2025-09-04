import { BrandConfig, CSVCalendarRow, ValidationError, ScheduleBlock } from '@/types/brand';

// Color validation
export function validateColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

// Button text validation
export function validateButtonText(text: string): boolean {
  return text.length >= 3 && text.length <= 30;
}

// Timezone validation (basic IANA format check)
export function validateTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Validate Brand Config
export function validateBrandConfig(config: Partial<BrandConfig>): string[] {
  const errors: string[] = [];
  
  if (!config.locationId) {
    errors.push('Location ID is required');
  }
  
  if (!config.primaryColorHex || !validateColor(config.primaryColorHex)) {
    errors.push('Primary color must be a valid hex color (#RRGGBB)');
  }
  
  if (!config.backgroundColorHex || !validateColor(config.backgroundColorHex)) {
    errors.push('Background color must be a valid hex color (#RRGGBB)');
  }
  
  if (!config.defaultButtonText || !validateButtonText(config.defaultButtonText)) {
    errors.push('Default button text must be 3-30 characters');
  }
  
  if (config.timezone && !validateTimezone(config.timezone)) {
    errors.push('Invalid timezone format');
  }
  
  return errors;
}

// Parse schedule blocks: "Mon 09:00-10:00; Wed 14:30-15:30"
export function parseScheduleBlocks(scheduleStr: string): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  
  if (!scheduleStr?.trim()) return blocks;
  
  const dayMap: Record<string, string> = {
    'mon': 'Monday', 'monday': 'Monday',
    'tue': 'Tuesday', 'tuesday': 'Tuesday', 'tues': 'Tuesday',
    'wed': 'Wednesday', 'wednesday': 'Wednesday',
    'thu': 'Thursday', 'thursday': 'Thursday', 'thurs': 'Thursday',
    'fri': 'Friday', 'friday': 'Friday',
    'sat': 'Saturday', 'saturday': 'Saturday',
    'sun': 'Sunday', 'sunday': 'Sunday'
  };
  
  const segments = scheduleStr.split(';').map(s => s.trim());
  
  for (const segment of segments) {
    if (!segment) continue;
    
    // Match pattern: "Mon 09:00-10:00" or "Monday 09:00-10:00"
    const match = segment.match(/^(\w+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);
    
    if (match) {
      const [, dayToken, start, end] = match;
      const normalizedDay = dayMap[dayToken.toLowerCase()];
      
      if (normalizedDay && isValidTime(start) && isValidTime(end)) {
        blocks.push({
          day: normalizedDay,
          start,
          end
        });
      }
    }
  }
  
  return blocks;
}

// Validate time format (HH:MM)
function isValidTime(time: string): boolean {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

// Slugify calendar name
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Collapse multiple hyphens
    .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

// Generate unique slug
export async function generateUniqueSlug(
  baseName: string, 
  checkExists: (slug: string) => Promise<boolean>
): Promise<string> {
  let slug = slugify(baseName);
  let counter = 1;
  
  while (await checkExists(slug)) {
    counter++;
    slug = `${slugify(baseName)}-${counter}`;
  }
  
  return slug;
}

// Validate CSV row
export function validateCSVRow(
  row: CSVCalendarRow, 
  rowIndex: number, 
  brandConfig?: BrandConfig
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Required field validation
  if (!row.calendar_type || row.calendar_type.toLowerCase() !== 'event') {
    errors.push({
      row: rowIndex,
      field: 'calendar_type',
      message: 'Calendar type must be "event"',
      severity: 'error'
    });
  }
  
  if (!row.calendar_name?.trim()) {
    errors.push({
      row: rowIndex,
      field: 'calendar_name',
      message: 'Calendar name is required',
      severity: 'error'
    });
  }
  
  // Validate schedule blocks or day/time
  if (row.schedule_blocks) {
    const blocks = parseScheduleBlocks(row.schedule_blocks);
    if (blocks.length === 0) {
      errors.push({
        row: rowIndex,
        field: 'schedule_blocks',
        message: 'Invalid schedule blocks format. Use "Mon 09:00-10:00; Wed 14:30-15:30"',
        severity: 'error'
      });
    }
  } else {
    if (!row.day_of_week?.trim()) {
      errors.push({
        row: rowIndex,
        field: 'day_of_week',
        message: 'Day of week is required when schedule_blocks not provided',
        severity: 'error'
      });
    }
    
    if (!row.time_of_week?.trim() || !isValidTime(row.time_of_week)) {
      errors.push({
        row: rowIndex,
        field: 'time_of_week',
        message: 'Valid time of week is required (HH:MM format)',
        severity: 'error'
      });
    }
  }
  
  // Validate numeric fields
  const slotInterval = parseInt(row.slot_interval);
  const classDuration = parseInt(row.class_duration);
  
  if (isNaN(slotInterval) || slotInterval <= 0) {
    errors.push({
      row: rowIndex,
      field: 'slot_interval',
      message: 'Slot interval must be a positive number',
      severity: 'error'
    });
  }
  
  if (isNaN(classDuration) || classDuration <= 0) {
    errors.push({
      row: rowIndex,
      field: 'class_duration',
      message: 'Class duration must be a positive number',
      severity: 'error'
    });
  }
  
  // Check if duration is divisible by slot interval
  if (!isNaN(slotInterval) && !isNaN(classDuration) && classDuration % slotInterval !== 0) {
    errors.push({
      row: rowIndex,
      field: 'class_duration',
      message: `Class duration (${classDuration}) should be divisible by slot interval (${slotInterval})`,
      severity: 'warning'
    });
  }
  
  // Validate optional color overrides
  if (row.primary_color_hex && !validateColor(row.primary_color_hex)) {
    errors.push({
      row: rowIndex,
      field: 'primary_color_hex',
      message: 'Primary color must be a valid hex color (#RRGGBB)',
      severity: 'error'
    });
  }
  
  if (row.background_color_hex && !validateColor(row.background_color_hex)) {
    errors.push({
      row: rowIndex,
      field: 'background_color_hex',
      message: 'Background color must be a valid hex color (#RRGGBB)',
      severity: 'error'
    });
  }
  
  // Validate timezone override
  if (row.timezone && !validateTimezone(row.timezone)) {
    errors.push({
      row: rowIndex,
      field: 'timezone',
      message: 'Invalid timezone format',
      severity: 'error'
    });
  }
  
  // Validate button text override
  if (row.button_text && !validateButtonText(row.button_text)) {
    errors.push({
      row: rowIndex,
      field: 'button_text',
      message: 'Button text must be 3-30 characters',
      severity: 'error'
    });
  }
  
  return errors;
}
