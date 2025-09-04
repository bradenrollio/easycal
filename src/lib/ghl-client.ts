import { CalendarPayload } from '@/types/brand';

export interface GHLGroup {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface GHLCalendar {
  id: string;
  name: string;
  slug: string;
  groupId?: string;
  isActive: boolean;
  customizations?: {
    primaryColor?: string;
    backgroundColor?: string;
    buttonText?: string;
  };
}

export class GHLCalendarClient {
  private accessToken: string;
  private locationId: string;
  private baseUrl = 'https://services.leadconnectorhq.com';

  constructor(accessToken: string, locationId: string) {
    this.accessToken = accessToken;
    this.locationId = locationId;
  }

  // Make authenticated API request
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Version': '2021-07-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GHL API Error ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Get or create calendar group
  async ensureGroup(groupName: string): Promise<string> {
    try {
      // First, try to find existing group
      const groups = await this.listGroups();
      const existingGroup = groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
      
      if (existingGroup) {
        return existingGroup.id;
      }

      // Create new group
      const groupData = {
        locationId: this.locationId,
        name: groupName,
        slug: this.slugify(groupName),
        isActive: true
      };

      const newGroup = await this.makeRequest('/calendars/groups', {
        method: 'POST',
        body: JSON.stringify(groupData)
      });

      return newGroup.group.id;
    } catch (error) {
      console.error('Error ensuring group:', error);
      throw error;
    }
  }

  // List calendar groups
  async listGroups(): Promise<GHLGroup[]> {
    try {
      const response = await this.makeRequest(`/calendars/groups?locationId=${this.locationId}`);
      return response.groups || [];
    } catch (error) {
      console.error('Error listing groups:', error);
      return [];
    }
  }

  // Check if calendar slug exists
  async checkSlugExists(slug: string): Promise<boolean> {
    try {
      const calendars = await this.listCalendars();
      return calendars.some(cal => cal.slug === slug);
    } catch (error) {
      console.error('Error checking slug:', error);
      return false;
    }
  }

  // Generate unique slug
  async generateUniqueSlug(baseName: string): Promise<string> {
    let slug = this.slugify(baseName);
    let counter = 1;
    
    while (await this.checkSlugExists(slug)) {
      counter++;
      slug = `${this.slugify(baseName)}-${counter}`;
    }
    
    return slug;
  }

  // Find existing calendar by slug
  async findCalendarBySlug(slug: string): Promise<GHLCalendar | null> {
    try {
      const calendars = await this.listCalendars();
      return calendars.find(cal => cal.slug === slug) || null;
    } catch (error) {
      console.error('Error finding calendar by slug:', error);
      return null;
    }
  }

  // Create or update calendar
  async createOrUpdateCalendar(payload: CalendarPayload): Promise<{ id: string; isUpdate: boolean }> {
    try {
      // Check if calendar already exists by slug
      const existingCalendar = await this.findCalendarBySlug(payload.slug);
      
      if (existingCalendar) {
        // Update existing calendar
        const updateData = {
          locationId: this.locationId,
          name: payload.name,
          description: payload.description,
          slug: payload.slug,
          widgetType: payload.widgetType,
          calendarType: 1, // Event calendar
          eventType: 'RoundRobin_OptimizeForAvailability',
          groupId: payload.groupId,
          isActive: true,
          
          // Customizations
          customizations: {
            ...payload.customizations,
            primaryColor: payload.customizations.primaryColor,
            backgroundColor: payload.customizations.backgroundColor,
            buttonText: payload.customizations.buttonText
          },
          
          // Availability settings
          availabilityTimezone: payload.timeZone,
          slotDurationMinutes: payload.availability.slotInterval,
          slotBufferMinutes: 0,
          minSchedulingNoticeMinutes: payload.minSchedulingNotice * 24 * 60, // Convert days to minutes
          maxSchedulingNoticeDays: 365, // Default to 1 year
          
          // Booking settings
          maxBookingsPerSlot: 1,
          maxBookingsPerDay: payload.maxBookingsPerDay,
          
          // Weekly availability
          availabilities: payload.availability.weekly.map(block => ({
            day: this.getDayNumber(block.day),
            hours: [{
              openTime: block.start,
              closeTime: block.end
            }]
          }))
        };

        const response = await this.makeRequest(`/calendars/${existingCalendar.id}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });

        return { id: response.calendar.id, isUpdate: true };
      } else {
        // Create new calendar
        const createData = {
          locationId: this.locationId,
          name: payload.name,
          description: payload.description,
          slug: payload.slug,
          widgetType: payload.widgetType,
          calendarType: 1, // Event calendar
          eventType: 'RoundRobin_OptimizeForAvailability',
          groupId: payload.groupId,
          isActive: true,
          
          // Customizations
          customizations: {
            ...payload.customizations,
            primaryColor: payload.customizations.primaryColor,
            backgroundColor: payload.customizations.backgroundColor,
            buttonText: payload.customizations.buttonText
          },
          
          // Availability settings
          availabilityTimezone: payload.timeZone,
          slotDurationMinutes: payload.availability.slotInterval,
          slotBufferMinutes: 0,
          minSchedulingNoticeMinutes: payload.minSchedulingNotice * 24 * 60, // Convert days to minutes
          maxSchedulingNoticeDays: 365, // Default to 1 year
          
          // Booking settings
          maxBookingsPerSlot: 1,
          maxBookingsPerDay: payload.maxBookingsPerDay,
          
          // Weekly availability
          availabilities: payload.availability.weekly.map(block => ({
            day: this.getDayNumber(block.day),
            hours: [{
              openTime: block.start,
              closeTime: block.end
            }]
          }))
        };

        const response = await this.makeRequest('/calendars', {
          method: 'POST',
          body: JSON.stringify(createData)
        });

        return { id: response.calendar.id, isUpdate: false };
      }
    } catch (error) {
      console.error('Error creating/updating calendar:', error);
      throw error;
    }
  }

  // Bulk delete calendars
  async deleteCalendars(calendarIds: string[]): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
    const results = { success: [], failed: [] };
    
    for (const calendarId of calendarIds) {
      try {
        await this.makeRequest(`/calendars/${calendarId}?locationId=${this.locationId}`, {
          method: 'DELETE'
        });
        results.success.push(calendarId);
      } catch (error) {
        results.failed.push({
          id: calendarId,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // List all calendars
  async listCalendars(): Promise<GHLCalendar[]> {
    try {
      const response = await this.makeRequest(`/calendars?locationId=${this.locationId}`);
      return response.calendars || [];
    } catch (error) {
      console.error('Error listing calendars:', error);
      return [];
    }
  }

  // Helper: Convert day name to number (0 = Sunday, 1 = Monday, etc.)
  private getDayNumber(dayName: string): number {
    const dayMap: Record<string, number> = {
      'Sun': 0, 'Sunday': 0,
      'Mon': 1, 'Monday': 1,
      'Tue': 2, 'Tuesday': 2,
      'Wed': 3, 'Wednesday': 3,
      'Thu': 4, 'Thursday': 4,
      'Fri': 5, 'Friday': 5,
      'Sat': 6, 'Saturday': 6
    };
    
    return dayMap[dayName] ?? 1; // Default to Monday
  }

  // Helper function
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}