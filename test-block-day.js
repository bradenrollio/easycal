#!/usr/bin/env node

/**
 * Test script to verify block day functionality with GHL API
 * Run with: node test-block-day.js
 */

async function testBlockDay() {
  const locationId = 'mDfWsppm3K1s6XSbKcBh';
  const calendarId = '6arhwKJNnqG59cqCDGgd';
  const testDate = '2025-09-20'; // Tomorrow's date for testing

  console.log('Testing block day functionality...');
  console.log(`Location: ${locationId}`);
  console.log(`Calendar: ${calendarId}`);
  console.log(`Date to block: ${testDate}`);
  console.log('----------------------------\n');

  // First, get current calendar state
  console.log('1. Fetching current calendar state...');
  const getResponse = await fetch(
    `https://easycal.pages.dev/api/batch-update-calendars?calendarId=${calendarId}&locationId=${locationId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!getResponse.ok) {
    console.error('Failed to fetch calendar:', await getResponse.text());
    return;
  }

  const calendarData = await getResponse.json();
  console.log('Current availabilities count:', calendarData.calendar?.availabilities?.length || 0);

  // Check if date is already blocked
  const existingBlock = calendarData.calendar?.availabilities?.find(
    a => new Date(a.date).toISOString().split('T')[0] === testDate
  );

  if (existingBlock) {
    console.log(`Date ${testDate} already has an override:`, existingBlock);
  } else {
    console.log(`Date ${testDate} has no override currently`);
  }

  console.log('\n----------------------------\n');

  // Now test blocking the day
  console.log('2. Sending block day request...');
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
          reason: 'Test Block'
        }
      })
    }
  );

  if (!blockResponse.ok) {
    console.error('Block request failed:', await blockResponse.text());
    return;
  }

  const blockResult = await blockResponse.json();
  console.log('Block result:', JSON.stringify(blockResult, null, 2));

  console.log('\n----------------------------\n');

  // Verify the block was applied
  console.log('3. Verifying block was applied...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

  const verifyResponse = await fetch(
    `https://easycal.pages.dev/api/batch-update-calendars?calendarId=${calendarId}&locationId=${locationId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!verifyResponse.ok) {
    console.error('Failed to verify:', await verifyResponse.text());
    return;
  }

  const verifyData = await verifyResponse.json();
  const newBlock = verifyData.calendar?.availabilities?.find(
    a => new Date(a.date).toISOString().split('T')[0] === testDate
  );

  if (newBlock) {
    console.log('✅ Block successfully applied!');
    console.log('Block entry:', JSON.stringify(newBlock, null, 2));

    // Check the structure
    if (newBlock.hours && newBlock.hours.length === 0 && newBlock.deleted === false) {
      console.log('✅ Block structure is correct (empty hours, deleted: false)');
    } else {
      console.log('⚠️ Block structure might be incorrect');
      console.log('Expected: { hours: [], deleted: false }');
      console.log('Got:', { hours: newBlock.hours, deleted: newBlock.deleted });
    }
  } else {
    console.log('❌ Block was not found in calendar availabilities');
    console.log('Total availabilities after block:', verifyData.calendar?.availabilities?.length || 0);
  }

  console.log('\n----------------------------\n');
  console.log('Test complete!');
}

// Run the test
testBlockDay().catch(console.error);