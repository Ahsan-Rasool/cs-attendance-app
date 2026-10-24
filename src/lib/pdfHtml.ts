import { time12 } from './format.ts';
import type { DayKey } from './customTimetable.ts';
import { DAY_KEYS } from './customTimetable.ts';
import { canSkip, mustAttend, type Summary } from './attendance.ts';

export const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const STYLE = `<style>
 body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#0f1e3d;margin:24px}
 h1{font-size:20px;margin:0 0 2px;color:#14397d} .sub{color:#55627a;font-size:12px;margin-bottom:16px}
 table{border-collapse:collapse;width:100%;margin:8px 0 18px;font-size:12px}
 th{background:#14397d;color:#fff;text-align:left;padding:7px 8px} td{padding:7px 8px;border-bottom:1px solid #e2e7f0}
 h2{font-size:14px;margin:14px 0 0} .bad{color:#c62828;font-weight:700} .ok{color:#1b8a4c;font-weight:700}
 .foot{color:#8591a6;font-size:10px;margin-top:20px}
</style>`;

const stamp = () => new Date().toLocaleString();
const wrap = (title: string, sub: string, body: string) =>
  `<html><head><meta charset="utf-8"/>${STYLE}</head><body><h1>${esc(title)}</h1><div class="sub">${esc(sub)}</div>${body}<div class="foot">Generated ${esc(stamp())} · CS Attendance Plus</div></body></html>`;

export interface TimetableRow { startTime: string; endTime: string; type?: string; custom?: boolean; location?: string | null; course?: { name?: string }; instructor?: { name?: string } | null; sectionLabel?: string }

export function buildTimetableHtml(student: string, week: Record<DayKey, TimetableRow[]>): string {
  const cap = (d: string) => d[0].toUpperCase() + d.slice(1);
  const body = DAY_KEYS.map((d) => {
    const rows = (week[d] ?? []).filter((e) => e.type !== 'break');
    if (!rows.length) return '';
    return `<h2>${cap(d)}</h2><table><tr><th>Time</th><th>Class</th><th>Room</th><th>Teacher</th></tr>${rows.map((e) =>
      `<tr><td>${esc(time12(e.startTime))} – ${esc(time12(e.endTime))}</td><td>${esc(e.course?.name)}${e.custom ? ' (added by me)' : ''}</td><td>${esc(e.location ?? '')}</td><td>${esc(e.instructor?.name ?? '')}</td></tr>`).join('')}</table>`;
  }).join('') || '<p>No classes scheduled.</p>';
  return wrap('Weekly timetable', student, body);
}

export interface AttendanceRow { name: string; code?: string; summary: Summary; dates?: { date: string; status: string }[] }

export function buildAttendanceHtml(student: string, rows: AttendanceRow[], overall: Summary, threshold: number): string {
  const cls = (s: Summary) => (s.total && s.percent < threshold ? 'bad' : 'ok');
  const summary = `<table><tr><th>Course</th><th>Present</th><th>Absent</th><th>Total</th><th>Attendance</th><th>Status</th></tr>${rows.map((r) => {
    const s = r.summary;
    const status = !s.total ? '—' : s.percent >= threshold
      ? (canSkip(s.present, s.total, threshold) ? `Can miss ${canSkip(s.present, s.total, threshold)} more` : 'At the limit')
      : `Attend next ${mustAttend(s.present, s.total, threshold)}`;
    return `<tr><td>${esc(r.name)}${r.code ? ` <small>(${esc(r.code)})</small>` : ''}</td><td>${s.present}</td><td>${s.absent}</td><td>${s.total}</td><td class="${cls(s)}">${s.total ? s.percent + '%' : '—'}</td><td>${esc(status)}</td></tr>`;
  }).join('')}<tr><td><b>Overall</b></td><td><b>${overall.present}</b></td><td><b>${overall.absent}</b></td><td><b>${overall.total}</b></td><td class="${cls(overall)}"><b>${overall.total ? overall.percent + '%' : '—'}</b></td><td></td></tr></table>`;
  const detail = rows.filter((r) => r.dates?.length).map((r) =>
    `<h2>${esc(r.name)} — lecture log</h2><table><tr><th>Date</th><th>Status</th></tr>${r.dates!.map((d) => `<tr><td>${esc(d.date)}</td><td>${esc(d.status)}</td></tr>`).join('')}</table>`).join('');
  return wrap('Attendance report', `${student} · minimum required ${threshold}%`, summary + detail);
}

