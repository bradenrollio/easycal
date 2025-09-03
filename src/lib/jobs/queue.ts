import Bottleneck from 'bottleneck';

export interface JobData {
  id: string;
  type: 'create_calendars' | 'delete_calendars';
  tenantId: string;
  locationId?: string;
  data: any;
  createdAt: Date;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

/**
 * Job queue using Bottleneck for rate limiting
 */
class JobQueue {
  private limiter: Bottleneck;

  constructor() {
    this.limiter = new Bottleneck({
      maxConcurrent: 3, // Max 3 concurrent jobs
      minTime: 1000, // Min 1 second between jobs
      reservoir: 10, // 10 jobs per reservoir
      reservoirRefreshInterval: 60 * 1000, // Refresh every minute
      reservoirRefreshAmount: 10,
    });
  }

  /**
   * Add a job to the queue
   */
  async addJob<T>(job: JobData, processor: (data: any) => Promise<T>): Promise<T> {
    return this.limiter.schedule(async () => {
      const startTime = Date.now();

      try {
        console.log(`Processing job ${job.id} (${job.type})`);
        const result = await processor(job.data);

        const duration = Date.now() - startTime;
        console.log(`Job ${job.id} completed in ${duration}ms`);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`Job ${job.id} failed after ${duration}ms:`, error);

        throw error;
      }
    });
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      running: this.limiter.running(),
      queued: this.limiter.queued(),
    };
  }
}

// Export singleton instance
export const jobQueue = new JobQueue();

/**
 * Job processor for calendar creation
 */
export async function processCalendarCreation(data: {
  calendars: Array<{
    name: string;
    slug?: string;
    groupId?: string;
    availabilityTimezone: string;
    slotDurationMinutes: number;
    minNoticeMinutes: number;
    bookingWindowDays: number;
    isActive: boolean;
  }>;
  locationId?: string;
}): Promise<JobResult[]> {
  const results: JobResult[] = [];

  // Import here to avoid circular dependencies
  const { createSDKClient } = await import('@/lib/sdk/client');

  // In a real app, you'd get the client with proper authentication
  const sdk = createSDKClient({
    // This would be populated from stored tokens
  });

  for (const calendar of data.calendars) {
    const startTime = Date.now();

    try {
      // Generate slug if not provided
      const slug = calendar.slug || generateSlug(calendar.name);

      const result = await sdk.createCalendar({
        ...calendar,
        slug,
      }) as { id: string };

      results.push({
        success: true,
        data: {
          calendarId: result.id,
          name: calendar.name,
          slug,
        },
        duration: Date.now() - startTime,
      });
    } catch (error: any) {
      results.push({
        success: false,
        error: error.message || 'Failed to create calendar',
        duration: Date.now() - startTime,
      });
    }
  }

  return results;
}

/**
 * Job processor for calendar deletion
 */
export async function processCalendarDeletion(data: {
  calendarIds: string[];
  locationId?: string;
}): Promise<JobResult[]> {
  const results: JobResult[] = [];

  // Import here to avoid circular dependencies
  const { createSDKClient } = await import('@/lib/sdk/client');

  // In a real app, you'd get the client with proper authentication
  const sdk = createSDKClient({
    // This would be populated from stored tokens
  });

  for (const calendarId of data.calendarIds) {
    const startTime = Date.now();

    try {
      await sdk.deleteCalendar(calendarId);

      results.push({
        success: true,
        data: { calendarId },
        duration: Date.now() - startTime,
      });
    } catch (error: any) {
      results.push({
        success: false,
        error: error.message || 'Failed to delete calendar',
        duration: Date.now() - startTime,
      });
    }
  }

  return results;
}

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 50); // Limit length
}
