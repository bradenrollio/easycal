#!/usr/bin/env node

/**
 * Test script to block a day and show the exact payload sent to GHL
 */

async function testBlockPayload() {
  const locationId = 'mDfWsppm3K1s6XSbKcBh';
  const calendarId = 'NXADuza2UiuCgz86ncx2';
  const blockDate = '2025-09-25'; // Future date for testing

  console.log('========================================');
  console.log('TESTING BLOCK DAY OPERATION');
  console.log('========================================');
  console.log(`Location ID: ${locationId}`);
  console.log(`Calendar ID: ${calendarId}`);
  console.log(`Date to block: ${blockDate}`);
  console.log('========================================\n');

  // Send block request
  console.log('Sending block request to our API...\n');

  const requestPayload = {
    locationId: locationId,
    calendarIds: [calendarId],
    updateData: {
      type: 'block',
      date: blockDate,
      reason: 'Test Block - Show Payload'
    }
  };

  console.log('REQUEST PAYLOAD TO OUR API:');
  console.log(JSON.stringify(requestPayload, null, 2));
  console.log('\n========================================\n');

  const blockResponse = await fetch(
    'https://easycal.pages.dev/api/batch-update-calendars',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    }
  );

  const blockResult = await blockResponse.json();

  console.log('API RESPONSE:');
  console.log(JSON.stringify(blockResult, null, 2));

  if (blockResult.success) {
    console.log('\n✅ Block request succeeded!');
  } else {
    console.log('\n❌ Block request failed');
  }

  // Wait a moment then verify
  console.log('\n========================================');
  console.log('Verifying the block was applied...\n');

  await new Promise(resolve => setTimeout(resolve, 2000));

  const verifyResponse = await fetch(
    `https://easycal.pages.dev/api/batch-update-calendars?calendarId=${calendarId}&locationId=${locationId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const verifyData = await verifyResponse.json();
  const calendar = verifyData.calendar?.calendar || verifyData.calendar;

  if (calendar && calendar.availabilities) {
    console.log(`Total availabilities in calendar: ${calendar.availabilities.length}`);

    // Look for our blocked date
    const blockedEntry = calendar.availabilities.find(
      a => a.date && new Date(a.date).toISOString().split('T')[0] === blockDate
    );

    if (blockedEntry) {
      console.log('\n✅ BLOCKED DATE FOUND IN CALENDAR!');
      console.log('Blocked entry structure:');
      console.log(JSON.stringify(blockedEntry, null, 2));
    } else {
      console.log('\n❌ Blocked date NOT found in calendar');
      console.log('All availabilities:');
      calendar.availabilities.forEach((avail, i) => {
        const date = avail.date ? new Date(avail.date).toISOString().split('T')[0] : 'no-date';
        console.log(`  [${i}] Date: ${date}, Has openHours: ${!!avail.openHours}`);
      });
    }
  } else {
    console.log('No availabilities found in calendar');
  }

  console.log('\n========================================');
  console.log('TEST COMPLETE');
  console.log('========================================');

  console.log('\n💡 Check the server logs for the exact payload sent to GHL');
  console.log('   The logs will show "Complete block payload being sent" with the full JSON');
}

// Run the test
testBlockPayload().catch(console.error);