// Pure planning of weekly class reminders (no native imports so it can be unit tested).
import type { TimetableEntry } from '../api/types.ts';
import { DAY_KEYS, type DayKey } from './customTimetable.ts';
import { time12 } from './format.ts';

export const LEAD_OPTIONS = [5, 10, 15, 30] as const;
export const DEFAULT_LEAD = 10;

export interface Reminder {
  id: string;
  weekday: number; // 1 = Sunday … 7 = Saturday (expo-notifications convention)
  hour: number;
  minute: number;
  title: string;
  body: string;
}

// DAY_KEYS starts on Monday; expo wants Sunday = 1.
const WEEKDAY_NUM: Record<DayKey, number> = { sunday: 1, monday: 2, tuesday: 3, wednesday: 4, thursday: 5, friday: 6, saturday: 7 };

export function buildReminders(week: Record<DayKey, TimetableEntry[]>, leadMinutes: number): Reminder[] {
  const out: Reminder[] = [];
  for (const day of DAY_KEYS) {
    for (const e of week[day] ?? []) {
      if (e.type === 'break') continue;
      const [h, m] = e.startTime.slice(0, 5).split(':').map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
      let total = h * 60 + m - leadMinutes;
      let wd = WEEKDAY_NUM[day];
      if (total < 0) { total += 24 * 60; wd = wd === 1 ? 7 : wd - 1; } // rolls into the previous day
      const name = e.course?.name ?? 'Class';
      const body = [
        `Starts ${time12(e.startTime)}`,
        e.location ? `Room ${e.location}` : null,
        e.instructor?.name ?? null,
      ].filter(Boolean).join(' · ');
      out.push({ id: `${day}-${e.id}`, weekday: wd, hour: Math.floor(total / 60), minute: total % 60, title: `${name} in ${leadMinutes} min`, body });
    }
  }
  return out;
}
