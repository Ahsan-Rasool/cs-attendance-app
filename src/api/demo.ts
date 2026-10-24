// Offline demo data so the app can be explored (and screenshotted) without an
// account. Generated deterministically; nothing here touches the network.
import type { LectureInstance } from '../lib/attendance.ts';
import type { Enrollment, Notice, Performance, Timetable, Transcript, User } from './types.ts';

export const DEMO_USER: User = {
  id: 7,
  name: 'Ayesha Khan',
  email: 'demo@example.edu',
  role: 'student',
  registrationNo: '2023-CS-101',
  degree: 'BS Computer Science',
  batch: 'Fall 2023',
  section: 'A',
  departmentName: 'Computer Science',
  currentSemester: 'Fall 2025',
  totalCreditHours: 18,
  totalContactHours: 24,
  createdAt: '2023-09-01T00:00:00Z',
};

const COURSES = [
  { id: 101, name: 'Data Structures', code: 'CS-201', abbr: 'DSA', cr: 3, rate: 0.92, days: [1, 3], t: ['09:00', '10:30'], room: 'CS-3', teacher: 'Dr. Sana Malik', lab: false },
  { id: 102, name: 'Operating Systems', code: 'CS-301', abbr: 'OS', cr: 3, rate: 0.78, days: [2, 4], t: ['11:00', '12:30'], room: 'CS-5', teacher: 'Prof. Imran Aziz', lab: false },
  { id: 103, name: 'Database Systems', code: 'CS-302', abbr: 'DB', cr: 3, rate: 0.66, days: [1, 3], t: ['13:00', '14:30'], room: 'Lab-2', teacher: 'Dr. Hira Noor', lab: false },
  { id: 104, name: 'Computer Networks', code: 'CS-305', abbr: 'CN', cr: 3, rate: 0.84, days: [2, 5], t: ['09:00', '10:30'], room: 'CS-1', teacher: 'Mr. Bilal Ahmed', lab: false },
  { id: 105, name: 'Software Engineering Lab', code: 'CS-310L', abbr: 'SE-L', cr: 1, rate: 0.96, days: [5], t: ['11:00', '14:00'], room: 'Lab-1', teacher: 'Ms. Rabia Saeed', lab: true },
];

const pad = (n: number) => String(n).padStart(2, '0');
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const rnd = (seed: number) => { const x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); };

export const DEMO_ENROLLMENTS: Enrollment[] = COURSES.map((c) => ({
  id: c.id * 10,
  enrollmentStatus: 'enrolled',
  section: {
    id: c.id,
    sectionLabel: 'A',
    shift: 'Morning',
    course: { name: c.name, courseCode: c.code, abbreviation: c.abbr, creditHours: c.cr, contactHours: c.cr * 1.5, isLab: c.lab },
    instructor: { name: c.teacher, designation: 'Faculty' },
  },
}));

export function demoAttendance(sectionId: number): LectureInstance[] {
  const c = COURSES.find((x) => x.id === Number(sectionId));
  if (!c) return [];
  const out: LectureInstance[] = [];
  const start = new Date();
  start.setDate(start.getDate() - 70);
  const today = key(new Date());
  const hour = `${pad(new Date().getHours())}:00`;
  for (let i = 0; i <= 77; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (!c.days.includes(d.getDay())) continue;
    const seed = c.id * 1000 + i;
    const cancelled = rnd(seed + 1) < 0.05;
    // dips mid-semester then recovers: makes the trend chart interesting
    const mood = i > 25 && i < 45 ? -0.18 : 0;
    const here = rnd(seed) < c.rate + mood;
    out.push({
      lectureDate: key(d),
      startTime: `${c.t[0]}:00`,
      endTime: `${c.t[1]}:00`,
      cancelled,
      attendanceMarked: key(d) < today || (key(d) === today && c.t[1] < hour),
      presentStudentIds: here ? [7] : [],
    });
  }
  return out;
}

export function demoPerformance(sectionId: number): Performance {
  const base = 55 + (sectionId % 7) * 6;
  const mk = (id: number, title: string, type: string, w: number, max: number, f: number) => ({
    assessmentId: sectionId * 10 + id, title, type, weightage: w, maxTotalMarks: max,
    totalMarksObtained: Math.round(max * Math.min(0.98, (base + f) / 100)),
    percentage: Math.min(98, base + f), status: 'published',
  });
  const assessments = [mk(1, 'Quiz 1', 'quiz', 5, 10, 8), mk(2, 'Assignment 1', 'assignment', 10, 20, 12), mk(3, 'Midterm', 'midterm', 30, 50, 0)];
  const obtained = assessments.reduce((a, x) => a + (x.totalMarksObtained ?? 0), 0);
  const max = assessments.reduce((a, x) => a + x.maxTotalMarks, 0);
  return { assessments, totalMarksObtained: obtained, totalMaxMarks: max, overallPercentage: Math.round((obtained / max) * 1000) / 10, finalGrade: null };
}

export function demoTimetable(): Timetable {
  const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const tt: Timetable = {};
  for (const c of COURSES) for (const d of c.days) {
    const k = names[d];
    (tt[k] ??= []).push({
      id: `${c.id}-${d}`, type: 'class', startTime: `${c.t[0]}:00`, endTime: `${c.t[1]}:00`, location: c.room,
      course: { name: c.name, courseCode: c.code, abbreviation: c.abbr, isLab: c.lab },
      instructor: { name: c.teacher }, sectionLabel: 'A', courseInstanceSectionId: c.id,
    });
  }
  for (const k of Object.keys(tt) as (keyof Timetable)[]) tt[k]!.sort((a, b) => a.startTime.localeCompare(b.startTime));
  return tt;
}

export const DEMO_NOTICES: Notice[] = [
  { id: 1, title: 'Mid-term examination schedule', description: 'The mid-term examination schedule for Fall 2025 has been published. Please check the academic calendar and report clashes to the department office by Friday.', creatorName: 'Exam Cell', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 2, title: 'Attendance reminder', description: 'Students below 75% attendance will not be allowed to sit in the final examinations. Check your dashboard regularly.', creatorName: 'Department Office', createdAt: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: 3, title: 'Software Engineering lab venue change', description: 'The SE lab will be held in Lab-1 from next week.', creatorName: 'Ms. Rabia Saeed', createdAt: new Date(Date.now() - 86400000 * 9).toISOString() },
];

export const DEMO_TRANSCRIPT: Transcript = {
  cgpa: 3.42, totalCreditHours: 54,
  semesters: [
    { semesterId: 1, semester: 'Fall 2023', season: 'Fall', year: 2023, creditHours: 17, gpa: 3.1, courses: [{ courseName: 'Programming Fundamentals', courseCode: 'CS-101', grade: 'B+', creditHours: 3 }, { courseName: 'Calculus', courseCode: 'MT-101', grade: 'B', creditHours: 3 }] },
    { semesterId: 2, semester: 'Spring 2024', season: 'Spring', year: 2024, creditHours: 18, gpa: 3.35, courses: [{ courseName: 'Object Oriented Programming', courseCode: 'CS-102', grade: 'A-', creditHours: 3 }] },
    { semesterId: 3, semester: 'Fall 2024', season: 'Fall', year: 2024, creditHours: 19, gpa: 3.6, courses: [{ courseName: 'Discrete Structures', courseCode: 'CS-103', grade: 'A', creditHours: 3 }] },
  ],
};
