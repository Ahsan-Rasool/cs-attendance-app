// GPA maths. The grade scale is the common 4.0 scale; universities differ
// slightly, so every figure here is an estimate, not an official result.

export const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'] as const;
export type Grade = (typeof GRADES)[number];

export const GRADE_POINTS: Record<Grade, number> = {
  'A+': 4.0, A: 4.0, 'A-': 3.67, 'B+': 3.33, B: 3.0, 'B-': 2.67,
  'C+': 2.33, C: 2.0, 'C-': 1.67, 'D+': 1.33, D: 1.0, F: 0,
};

export interface GpaItem { credits: number; grade: Grade | null }

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Credit-weighted GPA of the items that have a grade; null when none do. */
export function semesterGpa(items: GpaItem[]): { gpa: number | null; credits: number } {
  const graded = items.filter((i) => i.grade && i.credits > 0);
  const credits = graded.reduce((a, i) => a + i.credits, 0);
  if (!credits) return { gpa: null, credits: 0 };
  const pts = graded.reduce((a, i) => a + GRADE_POINTS[i.grade!] * i.credits, 0);
  return { gpa: round2(pts / credits), credits };
}

/** CGPA after adding this semester's graded courses to the current CGPA. */
export function projectedCgpa(cgpa: number, creditsSoFar: number, items: GpaItem[]): number | null {
  const s = semesterGpa(items);
  if (s.gpa == null) return null;
  const total = creditsSoFar + s.credits;
  return round2((cgpa * creditsSoFar + s.gpa * s.credits) / total);
}

/** GPA needed over `newCredits` credits to reach `target` CGPA. */
export function requiredGpa(cgpa: number, creditsSoFar: number, newCredits: number, target: number): number | null {
  if (newCredits <= 0) return null;
  return round2((target * (creditsSoFar + newCredits) - cgpa * creditsSoFar) / newCredits);
}
