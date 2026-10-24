import { useMemo } from 'react';
import { useInfiniteQuery, useQueries, useQuery } from '@tanstack/react-query';
import * as api from '../api/endpoints.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import {
  attendanceSummary, combine, toDayAttendance, weeklyTrend,
  type DayAttendance, type Summary, type TrendPoint,
} from '../lib/attendance.ts';
import type { Enrollment } from '../api/types.ts';

const STALE = 60_000;

export function useEnrollments() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['enrollments', user?.id], queryFn: api.getMyEnrollments, staleTime: STALE });
}

export function useEnrolled(): { enrolled: Enrollment[]; query: ReturnType<typeof useEnrollments> } {
  const query = useEnrollments();
  const enrolled = useMemo(() => (query.data ?? []).filter((e) => e.enrollmentStatus === 'enrolled'), [query.data]);
  return { enrolled, query };
}

export function useSectionDays(sectionId: string | number) {
  const { user } = useAuth();
  const q = useQuery({ queryKey: ['attendance', user?.id, String(sectionId)], queryFn: () => api.getSectionAttendance(sectionId), staleTime: STALE });
  const days = useMemo(() => (q.data && user ? toDayAttendance(q.data, user.id) : []), [q.data, user]);
  return { ...q, days };
}

export function usePerformance(sectionId: string | number) {
  const { user } = useAuth();
  return useQuery({ queryKey: ['performance', user?.id, String(sectionId)], queryFn: () => api.getMyPerformance(sectionId), staleTime: STALE });
}

export interface CourseAttendance {
  enrollment: Enrollment;
  sectionId: string | number;
  days: DayAttendance[];
  summary: Summary;
  loaded: boolean;
}

/** Attendance of every enrolled course plus overall figures and trend. */
export function useAttendanceOverview() {
  const { user } = useAuth();
  const { enrolled, query: enrQ } = useEnrolled();
  const results = useQueries({
    queries: enrolled.map((e) => ({
      queryKey: ['attendance', user?.id, String(e.section.id)],
      queryFn: () => api.getSectionAttendance(e.section.id),
      staleTime: STALE,
    })),
  });
  const dataKey = results.map((r) => r.dataUpdatedAt).join(',');
  const courses: CourseAttendance[] = useMemo(() => enrolled.map((e, i) => {
    const data = results[i]?.data;
    const days = data && user ? toDayAttendance(data, user.id) : [];
    return { enrollment: e, sectionId: e.section.id, days, summary: attendanceSummary(days), loaded: !!data };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [enrolled, dataKey, user]);

  const overall = useMemo(() => combine(courses.map((c) => c.summary)), [courses]);
  const trend: TrendPoint[] = useMemo(() => weeklyTrend(courses.flatMap((c) => c.days)), [courses]);
  const pending = enrQ.isPending || (enrolled.length > 0 && results.some((r) => r.isPending));
  const error = enrQ.error ?? results.find((r) => r.error)?.error ?? null;
  const refetch = async () => { await enrQ.refetch(); await Promise.all(results.map((r) => r.refetch())); };
  const refetching = enrQ.isRefetching || results.some((r) => r.isRefetching);
  return { courses, overall, trend, pending, error, refetch, refetching, enrolled };
}

export function useTimetable() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['timetable', user?.id], queryFn: api.getTimetable, staleTime: 5 * 60_000 });
}

export const NOTICES_PAGE = 20;
export function useNotices() {
  const { user } = useAuth();
  const q = useInfiniteQuery({
    queryKey: ['notices', user?.id],
    queryFn: ({ pageParam }) => api.getNotices(pageParam, NOTICES_PAGE),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length * NOTICES_PAGE : undefined),
  });
  const notices = useMemo(() => q.data?.pages.flatMap((p) => p.notices) ?? [], [q.data]);
  return { ...q, notices };
}

export function useNotice(id: string | number) {
  return useQuery({ queryKey: ['notice', String(id)], queryFn: () => api.getNotice(id) });
}

export function useTranscript() {
  const { user } = useAuth();
  return useQuery({ queryKey: ['transcript', user?.id], queryFn: api.getTranscript, staleTime: 10 * 60_000 });
}
