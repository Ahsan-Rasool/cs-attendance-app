import test from 'node:test';
import assert from 'node:assert/strict';
import { semesterGpa, projectedCgpa, requiredGpa } from '../src/lib/gpa.ts';

test('semester GPA is credit weighted and ignores ungraded courses', () => {
  const r = semesterGpa([{ credits: 3, grade: 'A' }, { credits: 3, grade: 'B' }, { credits: 1, grade: 'B+' }, { credits: 3, grade: null }]);
  assert.deepEqual(r, { gpa: 3.48, credits: 7 }); // (12+9+3.33)/7
  assert.equal(semesterGpa([{ credits: 3, grade: null }]).gpa, null);
  assert.equal(semesterGpa([]).gpa, null);
});

test('projected CGPA combines history and this semester', () => {
  // 3.0 over 30 credits + 4.0 over 15 credits = 3.33
  assert.equal(projectedCgpa(3.0, 30, [{ credits: 15, grade: 'A' }]), 3.33);
  assert.equal(projectedCgpa(3.0, 30, [{ credits: 15, grade: null }]), null);
  assert.equal(projectedCgpa(0, 0, [{ credits: 3, grade: 'B' }]), 3);
});

test('required GPA to reach a target', () => {
  assert.equal(requiredGpa(3.0, 30, 15, 3.33), 3.99);
  assert.equal(requiredGpa(3.0, 30, 15, 3.5), 4.5); // not reachable (> 4.0)
  assert.equal(requiredGpa(3.4, 30, 15, 3.0), 2.2);
  assert.equal(requiredGpa(3.0, 30, 0, 3.5), null);
});
