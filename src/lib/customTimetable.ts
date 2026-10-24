// Student-added classes live only on this device (AsyncStorage); nothing is
// sent to the server. Pure helpers here, storage in the hook.
import type { Timetable, TimetableEntry } from '../api/types.ts';

export type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface CustomClass {
  id: string;
  day: DayKey;
  title: string;
  startTime: string; // HH:MM
  endTime: string;
  location?: string;
  note?: string;
}

export const DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const HHMM = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Accepts "9:5" style input too; returns normalised HH:MM or null. */
export function normalizeTime(v: string): string | null {
  const m = v.trim().match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const t = `${m[1].padStart(2, '0')}:${m[2]}`;
  return HHMM.test(t) ? t : null;
}

export function validateClass(c: Pick<CustomClass, 'title' | 'startTime' | 'endTime'>): string | null {
  if (!c.title.trim()) return 'Enter a class name.';
  const s = normalizeTime(c.startTime), e = normalizeTime(c.endTime);
  if (!s || !e) return 'Times must look like 09:30 (24-hour).';
  if (e <= s) return 'End time must be after start time.';
  return null;
}

export function toEntry(c: CustomClass): TimetableEntry {
  return {
    id: `custom-${c.id}`, type: 'class', custom: true, note: c.note,
    startTime: c.startTime, endTime: c.endTime, location: c.location ?? null,
    course: { name: c.title },
  };
}

/** Server timetable plus custom classes, each day sorted by start time. */
export function mergeTimetable(server: Timetable | undefined, custom: CustomClass[]): Record<DayKey, TimetableEntry[]> {
  const out = {} as Record<DayKey, TimetableEntry[]>;
  for (const d of DAY_KEYS) {
    const list = [...(server?.[d] ?? []), ...custom.filter((c) => c.day === d).map(toEntry)];
    out[d] = list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return out;
}

export function parseStored(raw: string | null): CustomClass[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((c) => c && typeof c.id === 'string' && DAY_KEYS.includes(c.day) && typeof c.title === 'string') : [];
  } catch { return []; }
}
