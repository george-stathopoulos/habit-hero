import assert from 'node:assert/strict';
import {occurrenceKey,occurrenceSql} from '../cloudflare/occurrence.mjs';
import {localDay} from '../cloudflare/timezone.mjs';

assert.equal(occurrenceKey('daily','2026-10-16'),'2026-10-16');
assert.equal(occurrenceKey('weekly','2026-10-16'),'2026-10-12');
assert.equal(occurrenceKey('weekly','2026-10-18'),'2026-10-12');
assert.equal(occurrenceKey('weekly','2026-10-19'),'2026-10-19');
assert.equal(occurrenceKey('monthly','2026-10-16'),'2026-10-01');
assert.equal(occurrenceKey('monthly','2026-10-31'),'2026-10-01');
assert.equal(occurrenceKey('once','2026-10-16'),'1970-01-01');
assert.equal(localDay('Europe/Athens',new Date('2026-10-16T21:30:00Z')),'2026-10-17');
assert.equal(localDay('America/New_York',new Date('2026-10-16T02:30:00Z')),'2026-10-15');
assert.equal(localDay('Europe/Athens',new Date('2026-10-25T22:30:00Z')),'2026-10-26');
assert.equal(localDay('Invalid/Zone',new Date('2026-10-16T21:30:00Z')),'2026-10-16');
assert.match(occurrenceSql,/weekday 0/);
console.log('Occurrence and timezone boundaries passed');
