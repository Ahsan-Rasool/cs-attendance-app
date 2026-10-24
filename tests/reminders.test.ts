import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTimetable } from '../src/lib/customTimetable.ts';
import { buildReminders } from '../src/lib/remindersPlan.ts';

const server = {
  monday: [
    { id: 1, startTime: '09:00:00', endTime: '10:30:00', location: 'CS-3', course: { name: 'Data Structures' }, instructor: { name: 'Dr. Sana' } },
    { id: 2, type: 'break', startTime: '10:30:00', endTime: '11:00:00' },
  ],
  sunday: [{ id: 3, startTime: '00:05:00', endTime: '01:00:00', course: { name: 'Night Lab' } }],
};

test('reminder time = start minus lead, room and teacher in the body', () => {
  const r = buildReminders(mergeTimetable(server, []), 10);
  const ds = r.find((x) => x.id === 'monday-1')!;
  assert.deepEqual([ds.weekday, ds.hour, ds.minute], [2, 8, 50]); // Monday = 2
  assert.equal(ds.title, 'Data Structures in 10 min');
  assert.equal(ds.body, 'Starts 9:00 AM · Room CS-3 · Dr. Sana');
});

test('breaks are skipped; missing room is omitted', () => {
  const r = buildReminders(mergeTimetable(server, []), 10);
  assert.equal(r.some((x) => x.id.endsWith('-2')), false);
  assert.equal(r.find((x) => x.id === 'sunday-3')!.body, 'Starts 12:05 AM');
});

test('lead time crossing midnight moves to the previous day', () => {
  const night = r0('sunday-3'); // Sunday 00:05 - 10 min = Saturday 23:55
  assert.deepEqual([night.weekday, night.hour, night.minute], [7, 23, 55]);
  function r0(id: string) { return buildReminders(mergeTimetable(server, []), 10).find((x) => x.id === id)!; }
  const mon = buildReminders(mergeTimetable({ monday: [{ id: 9, startTime: '00:05', endTime: '01:00' }] }, []), 10)[0];
  assert.deepEqual([mon.weekday, mon.hour, mon.minute], [1, 23, 55]); // Sunday
});

test('student-added classes get reminders too', () => {
  const week = mergeTimetable(undefined, [{ id: 'a', day: 'friday', title: 'Study group', startTime: '15:00', endTime: '16:00', location: 'Library' }]);
  const r = buildReminders(week, 15);
  assert.equal(r.length, 1);
  assert.deepEqual([r[0].weekday, r[0].hour, r[0].minute], [6, 14, 45]);
  assert.equal(r[0].body, 'Starts 3:00 PM · Room Library');
});
