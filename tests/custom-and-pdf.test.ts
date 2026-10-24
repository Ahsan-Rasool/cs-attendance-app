import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeTimetable, normalizeTime, validateClass, parseStored } from '../src/lib/customTimetable.ts';
import { buildAttendanceHtml, buildTimetableHtml, esc } from '../src/lib/pdfHtml.ts';

test('time normalisation and validation', () => {
  assert.equal(normalizeTime('9:30'), '09:30');
  assert.equal(normalizeTime('0930'), '09:30');
  assert.equal(normalizeTime('24:00'), null);
  assert.equal(normalizeTime('abc'), null);
  assert.equal(validateClass({ title: 'Gym', startTime: '10:00', endTime: '09:00' }), 'End time must be after start time.');
  assert.equal(validateClass({ title: ' ', startTime: '09:00', endTime: '10:00' }), 'Enter a class name.');
  assert.equal(validateClass({ title: 'Gym', startTime: '09:00', endTime: '10:00' }), null);
});

test('custom classes merge into the server timetable sorted by time', () => {
  const server = { monday: [{ id: 1, startTime: '11:00:00', endTime: '12:00:00', course: { name: 'OS' } }] };
  const w = mergeTimetable(server, [{ id: 'a', day: 'monday', title: 'Study', startTime: '09:00', endTime: '10:00' }, { id: 'b', day: 'friday', title: 'Gym', startTime: '17:00', endTime: '18:00' }]);
  assert.deepEqual(w.monday.map((e) => e.course?.name), ['Study', 'OS']);
  assert.equal(w.monday[0].custom, true);
  assert.equal(w.friday.length, 1);
  assert.equal(w.sunday.length, 0);
  assert.equal(mergeTimetable(undefined, []).monday.length, 0);
});

test('stored data parsing ignores junk', () => {
  assert.deepEqual(parseStored(null), []);
  assert.deepEqual(parseStored('not json'), []);
  assert.deepEqual(parseStored('[{"id":"x","day":"monday","title":"A","startTime":"09:00","endTime":"10:00"},{"id":1}]').length, 1);
});

test('PDF html escapes user text and reports status', () => {
  assert.equal(esc('<b>"x"&'), '&lt;b&gt;&quot;x&quot;&amp;');
  const wk = mergeTimetable(undefined, [{ id: 'a', day: 'monday', title: '<script>', startTime: '09:00', endTime: '10:00' }]);
  const t = buildTimetableHtml('Ayesha', wk);
  assert.ok(t.includes('&lt;script&gt;') && !t.includes('<script>') && t.includes('added by me'));
  const s = { present: 12, absent: 7, total: 19, percent: 63 };
  const a = buildAttendanceHtml('Ayesha', [{ name: 'DB', summary: s, dates: [{ date: '2025-10-01', status: 'Absent' }] }], s, 75);
  assert.ok(a.includes('Attend next 9') && a.includes('63%') && a.includes('lecture log') && a.includes('class="bad"'));
});
