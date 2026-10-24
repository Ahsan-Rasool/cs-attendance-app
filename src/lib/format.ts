import type { Course, TimetableEntry, User } from '../api/types.ts';

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_KEYS = { Mon: 'monday', Tue: 'tuesday', Wed: 'wednesday', Thu: 'thursday', Fri: 'friday', Sat: 'saturday', Sun: 'sunday' } as const;
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const hhmm = (t: string) => t.slice(0, 5);

export function time12(t: string): string {
  const [h, m] = hhmm(t).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
export const timeRange = (a: string, b: string) => `${time12(a)} – ${time12(b)}`;

export function courseName(c?: Course): string {
  if (!c) return 'Course';
  return c.isLab && !/lab/i.test(c.name) ? `${c.name} (Lab)` : c.name;
}
export const courseShort = (c?: Course) => c?.abbreviation || c?.courseCode || c?.name || '—';

export type ClassStatus = 'upcoming' | 'now' | 'done';
export function classStatus(e: Pick<TimetableEntry, 'startTime' | 'endTime'>, now: Date): ClassStatus {
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (hm >= hhmm(e.endTime)) return 'done';
  if (hm >= hhmm(e.startTime)) return 'now';
  return 'upcoming';
}

const nm = (v: unknown): string | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  const o = v as { label?: string; name?: string; season?: string; year?: number | string };
  return o.label ?? o.name ?? ([o.season, o.year].filter(Boolean).join(' ') || undefined);
};
export const semesterLabel = (u?: User | null) => nm(u?.currentSemester);
export const degreeLabel = (u?: User | null) => nm(u?.degree);
export const batchLabel = (u?: User | null) => nm(u?.batch);
export const sectionLabelOf = (u?: User | null) => nm(u?.section);

export const initials = (name?: string) =>
  (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join('') || '?';

export function greeting(d = new Date()): string {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function formatDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : fallback;
};

export function gradeColor(g?: string | null): 'success' | 'warning' | 'danger' | 'muted' {
  if (!g) return 'muted';
  const x = g.toUpperCase();
  if (x.startsWith('A') || x.startsWith('B')) return 'success';
  if (x.startsWith('C')) return 'warning';
  return 'danger';
}
