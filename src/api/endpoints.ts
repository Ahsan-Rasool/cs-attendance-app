import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LectureInstance } from '../lib/attendance.ts';
import { cachedGet, request, tokenStore, LOGIN_ERRORS, ApiError } from './client.ts';
import * as demo from './demo.ts';
import type {
  Enrollment, Notice, NoticePage, Performance, Timetable, Transcript, User,
} from './types.ts';

// Demo mode: set by the login screen, never persisted across app restarts.
let demoMode = false;
export const isDemo = () => demoMode;
export const setDemo = (v: boolean) => { demoMode = v; };

const unwrap = <T,>(r: unknown): T => {
  const d = (r as { data?: unknown } | null)?.data;
  return (Array.isArray(r) || d === undefined ? r : d) as T;
};

export async function login(email: string, password: string, turnstileToken: string) {
  try {
    const r = await request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: { email, password, turnstileToken },
    });
    await tokenStore.save(r.accessToken, r.refreshToken);
  } catch (e) {
    if (e instanceof ApiError && LOGIN_ERRORS[e.message]) throw new ApiError(LOGIN_ERRORS[e.message], e.status, e.details);
    throw e;
  }
}

export async function forgotPassword(email: string) {
  await request('/auth/forgot-password', { method: 'POST', body: { email } });
}

export async function logout() {
  const rt = await tokenStore.getRefresh();
  if (rt && !demoMode) {
    try { await request('/auth/logout', { method: 'POST', body: { refreshToken: rt } }); } catch { /* best effort */ }
  }
  await tokenStore.clear();
  const keys = (await AsyncStorage.getAllKeys().catch(() => [] as readonly string[])).filter((k) => k.startsWith('csap.cache:'));
  if (keys.length) await AsyncStorage.multiRemove(keys).catch(() => {});
  demoMode = false;
}

export async function changePassword(currentPassword: string, newPassword: string) {
  if (demoMode) return;
  await request('/auth/change-password', { method: 'POST', auth: true, body: { currentPassword, newPassword } });
}

export async function getMe(): Promise<User> {
  if (demoMode) return demo.DEMO_USER;
  return cachedGet<User>('/user/me');
}

export async function getMyEnrollments(): Promise<Enrollment[]> {
  if (demoMode) return demo.DEMO_ENROLLMENTS;
  return unwrap<Enrollment[]>(await cachedGet('/enrollments/me'));
}

export async function getSectionAttendance(sectionId: string | number): Promise<LectureInstance[]> {
  if (demoMode) return demo.demoAttendance(Number(sectionId));
  return unwrap<LectureInstance[]>(await cachedGet(`/attendance/section/${sectionId}`));
}

export async function getMyPerformance(sectionId: string | number): Promise<Performance> {
  if (demoMode) return demo.demoPerformance(Number(sectionId));
  return cachedGet<Performance>(`/assessments/sections/${sectionId}/my-performance`);
}

export async function getTimetable(): Promise<Timetable> {
  if (demoMode) return demo.demoTimetable();
  return cachedGet<Timetable>('/timetable');
}

export async function getNotices(offset: number, limit: number): Promise<NoticePage> {
  if (demoMode) return { notices: demo.DEMO_NOTICES.slice(offset, offset + limit), hasMore: offset + limit < demo.DEMO_NOTICES.length };
  return cachedGet<NoticePage>(`/notices?limit=${limit}&offset=${offset}`);
}

export async function getNotice(id: string | number): Promise<Notice> {
  if (demoMode) return demo.DEMO_NOTICES.find((n) => String(n.id) === String(id)) ?? demo.DEMO_NOTICES[0];
  return cachedGet<Notice>(`/notices/${id}`);
}

export async function getTranscript(): Promise<Transcript> {
  if (demoMode) return demo.DEMO_TRANSCRIPT;
  return cachedGet<Transcript>('/enrollments/me/transcript');
}
