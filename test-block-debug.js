#!/usr/bin/env node

/**
 * Debug script to test block day functionality and see GHL responses
 */

async function testBlockDebug() {
  const locationId = 'mDfWsppm3K1s6XSbKcBh';
  const calendarId = 'NXADuza2UiuCgz86ncx2';
  const testDate = '2025-09-21'; // Different date

  console.log('Testing block day with debug info...');
  console.log(`Location: ${locationId}`);
  console.log(`Calendar: ${calendarId}`);
  console.log(`Date to block: ${testDate}`);
  console.log('----------------------------\n');

  // Send block request to our API with debug
  console.log('Sending block request to our API...');
  const blockResponse = await fetch(
    'https://easycal.pages.dev/api/batch-update-calendars',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locationId: locationId,
        calendarIds: [calendarId],
        updateData: {
          type: 'block',
          date: testDate,
          reason: 'Debug Test Block'
        }
      })
    }
  );

  const blockResult = await blockResponse.json();
  console.log('Block API response:', JSON.stringify(blockResult, null, 2));

  // Wait a bit for propagation
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Now check directly with GHL API (if we have access token)
  // For now, check via our GET endpoint
  console.log('\n----------------------------');
  console.log('Fetching calendar data after block...\n');

  const getResponse = await fetch(
    `https://easycal.pages.dev/api/batch-update-calendars?calendarId=${calendarId}&locationId=${locationId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const calendarData = await getResponse.json();

  // Check calendar structure
  const calendar = calendarData.calendar?.calendar || calendarData.calendar;

  console.log('Calendar availabilities field exists:', 'availabilities' in calendar);
  console.log('Availabilities count:', calendar.availabilities?.length || 0);

  if (calendar.availabilities && calendar.availabilities.length > 0) {
    console.log('\nAll availabilities:');
    calendar.availabilities.forEach((avail, i) => {
      console.log(`  [${i}] Date: ${avail.date}, Deleted: ${avail.deleted}, Hours: ${JSON.stringify(avail.hours)}`);
    });
  }

  // Check openHours structure
  console.log('\nCalendar openHours:', JSON.stringify(calendar.openHours?.slice(0, 2), null, 2));
  console.log('AvailabilityType:', calendar.availabilityType);

  console.log('\n----------------------------');
  console.log('Debug complete!');
}

// Run the test
testBlockDebug().catch(console.error);