import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toDayAttendance, attendanceSummary, canSkip, mustAttend, projectPercent,
  weeklyTrend, presentStreak, riskOf, combine,
} from '../src/lib/attendance.ts';

const NOW = new Date(2025, 9, 15, 11, 0); // Wed 15 Oct 2025, 11:00
const lec = (lectureDate: string, o: object = {}) => ({ lectureDate, startTime: '09:00', endTime: '10:00', attendanceMarked: true, presentStudentIds: [7], ...o });

test('status rules match the original app', () => {
  const d = toDayAttendance([
    lec('2025-10-13'),                                         // present
    lec('2025-10-14', { presentStudentIds: [1] }),             // absent
    lec('2025-10-14', { cancelled: true }),                    // cancelled
    lec('2025-10-12', { attendanceMarked: false }),            // unmarked
    lec('2025-10-16'),                                         // future, marked flag ignored? -> marked => present
    lec('2025-10-16', { attendanceMarked: false }),            // upcoming
    lec('2025-10-15', { attendanceMarked: false, startTime: '12:00', endTime: '13:00' }), // upcoming today
    lec('2025-10-15', { attendanceMarked: false, startTime: '10:30', endTime: '12:00' }), // in progress
    lec('2025-10-15', { attendanceMarked: false }),            // ended today, unmarked
  ], '7', NOW).map((x) => x.status);
  assert.deepEqual(d, ['present','absent','cancelled','unmarked','present','upcoming','upcoming','in-progress','unmarked']);
});

test('summary counts only present+absent', () => {
  const s = attendanceSummary(toDayAttendance([lec('2025-10-13'), lec('2025-10-14', { presentStudentIds: [] }), lec('2025-10-12', { cancelled: true }), lec('2025-10-11', { attendanceMarked: false })], 7, NOW));
  assert.deepEqual(s, { present: 1, absent: 1, total: 2, percent: 50 });
  assert.equal(attendanceSummary([]).percent, 0);
});

test('skip / attend math', () => {
  assert.equal(canSkip(18, 20), 4);      // 18/24 = 75%
  assert.equal(canSkip(15, 20), 0);      // exactly 75% -> cannot miss another
  assert.equal(canSkip(10, 20), 0);
  assert.equal(mustAttend(10, 20), 20);  // (10+20)/(40) = 75%
  assert.equal(mustAttend(15, 20), 0);
  assert.equal(mustAttend(0, 4), 12);    // 12/16
  assert.equal(projectPercent(18, 20, 0, 4), 75);
  assert.equal(projectPercent(0, 0, 0, 0), 0);
});

test('weekly trend is cumulative and Monday based', () => {
  const t = weeklyTrend([
    { date: '2025-10-06', status: 'present' }, { date: '2025-10-08', status: 'absent' },
    { date: '2025-10-13', status: 'present' }, { date: '2025-10-12', status: 'present' }, // Sunday belongs to the week of Oct 6
    { date: '2025-10-14', status: 'cancelled' },
  ]);
  assert.deepEqual(t.map((x) => [x.label, x.percent, x.total]), [['2025-10-06', 66.7, 3], ['2025-10-13', 75, 4]]);
});

test('streak, risk, combine', () => {
  assert.equal(presentStreak([{ date: '2025-10-01', status: 'absent' }, { date: '2025-10-02', status: 'present' }, { date: '2025-10-03', status: 'present' }]), 2);
  assert.equal(riskOf({ present: 0, absent: 0, total: 0, percent: 0 }), 'none');
  assert.equal(riskOf({ present: 10, absent: 10, total: 20, percent: 50 }), 'danger');
  assert.equal(riskOf({ present: 15, absent: 5, total: 20, percent: 75 }), 'warning');
  assert.equal(riskOf({ present: 20, absent: 0, total: 20, percent: 100 }), 'safe');
  assert.equal(combine([{ present: 1, absent: 1, total: 2, percent: 50 }, { present: 3, absent: 0, total: 3, percent: 100 }]).percent, 80);
});
