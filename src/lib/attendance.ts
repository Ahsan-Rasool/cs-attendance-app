// Pure attendance logic. Mirrors the rules of the original app (a lecture is
// "present" when the student's id is in presentStudentIds of a marked lecture,
// "absent" when marked but the id is missing, cancelled lectures never count)
// and adds the analytics used by the new dashboard and graphs.

export interface LectureInstance {
  lectureDate: string; // YYYY-MM-DD
  startTime?: string | null; // HH:MM[:SS]
  endTime?: string | null;
  cancelled?: boolean;
  attendanceMarked?: boolean;
  presentStudentIds?: Array<string | number>;
}

export type DayStatus =
  | 'present'
  | 'absent'
  | 'unmarked'
  | 'cancelled'
  | 'upcoming'
  | 'in-progress';

export interface DayAttendance {
  date: string;
  status: DayStatus;
}

export interface Summary {
  present: number;
  absent: number;
  total: number; // present + absent (the lectures that count)
  percent: number; // rounded, 0 when total is 0
}

export const DEFAULT_THRESHOLD = 75;

const pad = (n: number) => String(n).padStart(2, '0');

export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function nowHm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toDayAttendance(
  instances: LectureInstance[],
  studentId: string | number,
  now: Date = new Date(),
): DayAttendance[] {
  const today = localDateKey(now);
  const hm = nowHm(now);
  const me = String(studentId);
  return instances.map((i) => {
    const future = i.lectureDate > today;
    const notStarted =
      i.lectureDate === today && !!i.startTime && hm < i.startTime.slice(0, 5);
    const notEnded =
      i.lectureDate === today && !!i.endTime && hm < i.endTime.slice(0, 5);
    let status: DayStatus;
    if (i.cancelled) status = 'cancelled';
    else if (!i.attendanceMarked) {
      if (future || notStarted) status = 'upcoming';
      else if (notEnded) status = 'in-progress';
      else status = 'unmarked';
    } else {
      status = (i.presentStudentIds ?? []).map(String).includes(me)
        ? 'present'
        : 'absent';
    }
    return { date: i.lectureDate, status };
  });
}

export function attendanceSummary(days: DayAttendance[]): Summary {
  const counted = days.filter((d) => d.status === 'present' || d.status === 'absent');
  const present = counted.filter((d) => d.status === 'present').length;
  const total = counted.length;
  return {
    present,
    absent: total - present,
    total,
    percent: total ? Math.round((present / total) * 100) : 0,
  };
}

/** How many more lectures can be missed while staying >= threshold. */
export function canSkip(present: number, total: number, threshold = DEFAULT_THRESHOLD): number {
  if (total === 0) return 0;
  const t = threshold / 100;
  return Math.max(0, Math.floor(present / t - total + 1e-9));
}

/** How many consecutive lectures must be attended to reach the threshold. */
export function mustAttend(present: number, total: number, threshold = DEFAULT_THRESHOLD): number {
  const t = threshold / 100;
  if (t >= 1) return present === total ? 0 : Infinity;
  if (total === 0 || present / total >= t) return 0;
  return Math.ceil((t * total - present) / (1 - t) - 1e-9);
}

/** Percentage after attending / missing `n` more lectures. */
export function projectPercent(
  present: number,
  total: number,
  attend: number,
  miss: number,
): number {
  const t = total + attend + miss;
  return t ? Math.round(((present + attend) / t) * 1000) / 10 : 0;
}

export interface TrendPoint {
  label: string; // week start, YYYY-MM-DD
  percent: number; // cumulative % at the end of that week
  present: number;
  total: number;
}

function weekStart(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const shift = (dt.getDay() + 6) % 7; // Monday as first day
  dt.setDate(dt.getDate() - shift);
  return localDateKey(dt);
}

/** Cumulative attendance % at the end of each week. */
export function weeklyTrend(days: DayAttendance[]): TrendPoint[] {
  const counted = days
    .filter((d) => d.status === 'present' || d.status === 'absent')
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const byWeek = new Map<string, { present: number; total: number }>();
  for (const d of counted) {
    const k = weekStart(d.date);
    const w = byWeek.get(k) ?? { present: 0, total: 0 };
    w.total += 1;
    if (d.status === 'present') w.present += 1;
    byWeek.set(k, w);
  }
  let cp = 0;
  let ct = 0;
  return [...byWeek.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([label, w]) => {
      cp += w.present;
      ct += w.total;
      return { label, percent: Math.round((cp / ct) * 1000) / 10, present: cp, total: ct };
    });
}

/** Current run of consecutively attended lectures (most recent first). */
export function presentStreak(days: DayAttendance[]): number {
  const counted = days
    .filter((d) => d.status === 'present' || d.status === 'absent')
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  let n = 0;
  for (const d of counted) {
    if (d.status !== 'present') break;
    n += 1;
  }
  return n;
}

export type Risk = 'safe' | 'warning' | 'danger' | 'none';

export function riskOf(s: Summary, threshold = DEFAULT_THRESHOLD): Risk {
  if (s.total === 0) return 'none';
  if (s.percent < threshold) return 'danger';
  if (canSkip(s.present, s.total, threshold) === 0) return 'warning';
  return 'safe';
}

/** Combine several summaries into one overall summary. */
export function combine(summaries: Summary[]): Summary {
  const present = summaries.reduce((a, s) => a + s.present, 0);
  const total = summaries.reduce((a, s) => a + s.total, 0);
  return {
    present,
    absent: total - present,
    total,
    percent: total ? Math.round((present / total) * 100) : 0,
  };
}
