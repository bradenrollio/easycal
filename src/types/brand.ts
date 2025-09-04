export interface BrandConfig {
  locationId: string;
  primaryColorHex: string;      // e.g. "#FFC300"
  backgroundColorHex: string;   // e.g. "#FFFFFF"
  defaultButtonText: string;    // e.g. "Book Trial"
  timezone?: string;            // IANA, fallback "America/New_York"
  coverImageUrl?: string;       // calendar cover image for Group View
  updatedAt: string;            // ISO
}

export interface CSVCalendarRow {
  // Required fields
  calendar_type: string;
  calendar_name: string;
  day_of_week: string;
  time_of_week: string;
  slot_interval: string;
  class_duration: string;
  min_scheduling_notice: string;
  max_bookings_per_day: string;
  
  // Optional fields
  class_description?: string;
  calendar_group?: string;
  custom_url?: string;
  button_text?: string;
  primary_color_hex?: string;
  background_color_hex?: string;
  timezone?: string;
  calendar_purpose?: 'trial' | 'makeup' | 'regular';
  schedule_blocks?: string;
}

export interface CalendarPayload {
  locationId: string;
  name: string;
  description?: string;
  widgetType: 'default';
  customizations: {
    primaryColor: string;
    backgroundColor: string;
    buttonText: string;
  };
  duration: number;
  timeZone: string;
  availability: {
    weekly: Array<{
      day: string;
      start: string;
      end: string;
    }>;
    slotInterval: number;
  };
  minSchedulingNotice: number;
  maxBookingsPerDay: number;
  groupId?: string;
  slug: string;
}

export interface ScheduleBlock {
  day: string;
  start: string;
  end: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  success: boolean;
  calendarId?: string;
  slug: string;
  name: string;
  error?: string;
  warnings?: string[];
}
