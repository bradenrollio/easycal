// Quick test of helper functions
const { parseScheduleBlocks, slugify, to24h, normalizeDay } = require('./src/lib/helpers.ts');

console.log('Testing helper functions...\n');

// Test parseScheduleBlocks
console.log('1. Schedule parsing:');
const schedule1 = 'Mon 09:00-10:30; Wed 14:00-15:30; Fri 18:00-19:00';
console.log(`Input: "${schedule1}"`);
console.log('Output:', parseScheduleBlocks(schedule1));
console.log();

// Test with 12-hour format
const schedule2 = 'Tue 3:00 PM-4:30 PM; Thu 9:00 AM-10:00 AM';
console.log(`Input: "${schedule2}"`);
console.log('Output:', parseScheduleBlocks(schedule2));
console.log();

// Test slugify
console.log('2. Slugify:');
const names = ['Advanced Yoga Flow', 'Kids\' Martial Arts (Ages 5-8)', 'Make-Up Session #2'];
names.forEach(name => {
  console.log(`"${name}" -> "${slugify(name)}"`);
});
console.log();

// Test time conversion
console.log('3. Time conversion:');
const times = ['3:00 PM', '15:00', '9:30 AM', '12:00 PM', '12:00 AM'];
times.forEach(time => {
  console.log(`"${time}" -> "${to24h(time)}"`);
});
console.log();

// Test day normalization
console.log('4. Day normalization:');
const days = ['mon', 'Tuesday', 'Wed', 'THURSDAY', 'fri', 'saturday', 'SUN'];
days.forEach(day => {
  console.log(`"${day}" -> "${normalizeDay(day)}"`);
});
