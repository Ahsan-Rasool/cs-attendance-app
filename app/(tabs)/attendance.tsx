import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext.tsx';
import { Card, Chip, Empty, ErrorBanner, Row, Screen, SectionTitle, Skeleton, Txt } from '../../src/components/ui.tsx';
import { CourseBars, ProgressRing, TrendChart } from '../../src/components/charts.tsx';
import { AttendanceCalendar } from '../../src/components/AttendanceCalendar.tsx';
import { useAttendanceOverview } from '../../src/hooks/queries.ts';
import { canSkip, mustAttend, projectPercent, weeklyTrend } from '../../src/lib/attendance.ts';
import { courseName, courseShort, formatDate } from '../../src/lib/format.ts';

export default function AttendanceTab() {
  const { colors, threshold } = useTheme();
  const router = useRouter();
  const ov = useAttendanceOverview();
  const [sel, setSel] = useState<string>('all'); // 'all' or sectionId

  const course = ov.courses.find((c) => String(c.sectionId) === sel);
  const days = useMemo(() => (course ? course.days : ov.courses.flatMap((c) => c.days)), [course, ov.courses]);
  const summary = course ? course.summary : ov.overall;
  const trend = useMemo(() => (course ? weeklyTrend(course.days) : ov.trend), [course, ov.trend]);
  const [miss, setMiss] = useState(0);
  const [attend, setAttend] = useState(0);
  const projected = projectPercent(summary.present, summary.total, attend, miss);
  const skip = canSkip(summary.present, summary.total, threshold);
  const need = mustAttend(summary.present, summary.total, threshold);
  const recentAbsences = useMemo(() => days.filter((d) => d.status === 'absent').sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6), [days]);
  const unmarked = days.filter((d) => d.status === 'unmarked').length;
  const cancelled = days.filter((d) => d.status === 'cancelled').length;
  const color = summary.total === 0 ? colors.textFaint : summary.percent >= threshold ? colors.success : colors.danger;

  const chip = (key: string, label: string) => {
    const on = sel === key;
    return (
      <Pressable key={key} onPress={() => { setSel(key); setMiss(0); setAttend(0); }} accessibilityRole="button" accessibilityState={{ selected: on }}
        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: on ? colors.primary : colors.card, borderWidth: 1, borderColor: on ? colors.primary : colors.border }}>
        <Txt variant="caption" style={{ fontWeight: '700', color: on ? colors.onPrimary : colors.textMuted }}>{label}</Txt>
      </Pressable>
    );
  };

  return (
    <Screen onRefresh={ov.refetch} refreshing={ov.refetching}>
      <Txt variant="title">Attendance</Txt>
      {ov.error ? <ErrorBanner error={ov.error} onRetry={ov.refetch} /> : null}
      {ov.pending ? <><Skeleton height={60} /><Skeleton height={220} /><Skeleton height={140} /></> : ov.courses.length === 0 ? (
        <Empty icon="calendar-outline" title="No enrolled courses" text="Your attendance will appear here once you are enrolled in a course." />
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {chip('all', 'All courses')}
            {ov.courses.map((c) => chip(String(c.sectionId), courseShort(c.enrollment.section.course)))}
          </ScrollView>

          <Card style={{ gap: 14 }}>
            <Row style={{ gap: 18 }}>
              <ProgressRing percent={summary.percent} color={color} size={108} stroke={11} sub={course ? '' : 'overall'} />
              <View style={{ flex: 1, gap: 6 }}>
                <Txt variant="heading" numberOfLines={2}>{course ? courseName(course.enrollment.section.course) : 'All courses'}</Txt>
                <Row style={{ flexWrap: 'wrap', gap: 6 }}>
                  <Chip tone="success" label={`${summary.present} present`} />
                  <Chip tone="danger" label={`${summary.absent} absent`} />
                </Row>
                {unmarked || cancelled ? <Txt variant="caption" color="textFaint">{[unmarked && `${unmarked} not yet marked`, cancelled && `${cancelled} cancelled`].filter(Boolean).join(' · ')}</Txt> : null}
              </View>
            </Row>
          </Card>

          <SectionTitle>Trend</SectionTitle>
          <Card>
            {trend.length === 0 ? <Txt color="textMuted" variant="caption">The graph appears after the first lecture is marked.</Txt> : (
              <>
                <TrendChart points={trend} threshold={threshold} />
                <Txt variant="caption" color="textFaint" style={{ marginTop: 6 }}>Cumulative attendance at the end of each week.</Txt>
              </>
            )}
          </Card>

          {!course ? (
            <>
              <SectionTitle>By course</SectionTitle>
              <Card>
                <CourseBars threshold={threshold} items={ov.courses.map((c) => ({ key: String(c.sectionId), label: courseName(c.enrollment.section.course), percent: c.summary.percent, total: c.summary.total }))} />
              </Card>
            </>
          ) : null}

          <SectionTitle>What‑if planner</SectionTitle>
          <Card style={{ gap: 14 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Stepper label="If I miss" value={miss} onChange={setMiss} />
              <Stepper label="If I attend" value={attend} onChange={setAttend} />
            </Row>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt color="textMuted">You would be at</Txt>
              <Txt variant="title" color={projected >= threshold ? 'success' : 'danger'}>{projected}%</Txt>
            </Row>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            {summary.total === 0 ? <Txt variant="caption" color="textMuted">Nothing to plan yet — no lectures have been marked.</Txt>
              : summary.percent >= threshold
                ? <Row><Ionicons name="shield-checkmark" size={18} color={colors.success} /><Txt variant="caption" style={{ flex: 1 }}>{skip > 0 ? `You can miss ${skip} more lecture${skip === 1 ? '' : 's'} and stay at or above ${threshold}%.` : `You are exactly at the limit — don't miss the next one.`}</Txt></Row>
                : <Row><Ionicons name="warning" size={18} color={colors.danger} /><Txt variant="caption" style={{ flex: 1 }}>Attend the next {need} lecture{need === 1 ? '' : 's'} in a row to climb back to {threshold}%.</Txt></Row>}
          </Card>

          <SectionTitle>{course ? 'Calendar' : 'All lectures'}</SectionTitle>
          <Card><AttendanceCalendar days={days} /></Card>

          {recentAbsences.length ? (
            <>
              <SectionTitle>Recent absences</SectionTitle>
              <Card style={{ gap: 10 }}>
                {recentAbsences.map((d, i) => <Row key={i}><Ionicons name="close-circle" size={18} color={colors.danger} /><Txt>{formatDate(d.date)}</Txt></Row>)}
              </Card>
            </>
          ) : null}
          {course ? <Pressable onPress={() => router.push(`/course/${course.sectionId}`)}><Txt color="primary" style={{ textAlign: 'center', fontWeight: '700' }}>Open course details</Txt></Pressable> : null}
        </>
      )}
    </Screen>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const { colors } = useTheme();
  const btn = (icon: 'add' | 'remove', d: number) => (
    <Pressable accessibilityLabel={`${icon === 'add' ? 'Increase' : 'Decrease'} ${label}`} onPress={() => onChange(Math.max(0, Math.min(60, value + d)))} hitSlop={6}
      style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </Pressable>
  );
  return (
    <View style={{ gap: 6 }}>
      <Txt variant="caption" color="textMuted">{label}</Txt>
      <Row>{btn('remove', -1)}<Txt variant="title" style={{ minWidth: 30, textAlign: 'center' }}>{value}</Txt>{btn('add', 1)}</Row>
    </View>
  );
}

