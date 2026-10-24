import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext.tsx';
import { useAuth } from '../../src/auth/AuthContext.tsx';
import { Button, Card, Chip, Empty, ErrorBanner, Row, Screen, SectionTitle, Skeleton, Txt } from '../../src/components/ui.tsx';
import { CourseBars, ProgressRing } from '../../src/components/charts.tsx';
import { AttendanceCalendar, STATUS_LABEL } from '../../src/components/AttendanceCalendar.tsx';
import { CoursePlanner } from '../../src/components/CoursePlanner.tsx';
import { useAttendanceOverview } from '../../src/hooks/queries.ts';
import { courseName, courseShort, formatDate } from '../../src/lib/format.ts';
import { buildAttendanceHtml, sharePdf } from '../../src/lib/pdf.ts';

export default function AttendanceTab() {
  const { colors, threshold } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const ov = useAttendanceOverview();
  const [sel, setSel] = useState<string>('all'); // 'all' or sectionId
  const [busy, setBusy] = useState(false);

  const course = ov.courses.find((c) => String(c.sectionId) === sel);
  const days = useMemo(() => (course ? course.days : ov.courses.flatMap((c) => c.days)), [course, ov.courses]);
  const summary = course ? course.summary : ov.overall;
  const recentAbsences = useMemo(() => days.filter((d) => d.status === 'absent').sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6), [days]);
  const unmarked = days.filter((d) => d.status === 'unmarked').length;
  const cancelled = days.filter((d) => d.status === 'cancelled').length;
  const color = summary.total === 0 ? colors.textFaint : summary.percent >= threshold ? colors.success : colors.danger;
  const planned = course ? [course] : ov.courses;

  const exportPdf = async () => {
    setBusy(true);
    try {
      const rows = (course ? [course] : ov.courses).map((c) => ({
        name: courseName(c.enrollment.section.course), code: c.enrollment.section.course.courseCode, summary: c.summary,
        dates: [...c.days].filter((d) => d.status === 'present' || d.status === 'absent' || d.status === 'unmarked' || d.status === 'cancelled')
          .sort((a, b) => (a.date < b.date ? -1 : 1)).map((d) => ({ date: d.date, status: STATUS_LABEL[d.status] })),
      }));
      await sharePdf(buildAttendanceHtml(`${user?.name ?? ''}${user?.registrationNo ? ` · ${user.registrationNo}` : ''}`, rows, summary, threshold), 'attendance.pdf');
    } catch (e) {
      Alert.alert('Could not create PDF', e instanceof Error ? e.message : 'Unknown error');
    } finally { setBusy(false); }
  };

  const chip = (key: string, label: string) => {
    const on = sel === key;
    return (
      <Pressable key={key} onPress={() => setSel(key)} accessibilityRole="button" accessibilityState={{ selected: on }}
        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: on ? colors.primary : colors.card, borderWidth: 1, borderColor: on ? colors.primary : colors.border }}>
        <Txt variant="caption" style={{ fontWeight: '700', color: on ? colors.onPrimary : colors.textMuted }}>{label}</Txt>
      </Pressable>
    );
  };

  return (
    <Screen onRefresh={ov.refetch} refreshing={ov.refetching}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="title">Attendance</Txt>
        {ov.courses.length ? <View style={{ width: 178 }}><Button title="Download PDF" icon="download" onPress={exportPdf} loading={busy} variant="ghost" /></View> : null}
      </Row>
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

          {!course ? (
            <>
              <SectionTitle>By course</SectionTitle>
              <Card>
                <CourseBars threshold={threshold} items={ov.courses.map((c) => ({ key: String(c.sectionId), label: courseName(c.enrollment.section.course), percent: c.summary.percent, total: c.summary.total }))} />
              </Card>
            </>
          ) : null}

          <SectionTitle>What‑if planner</SectionTitle>
          {planned.map((c) => (
            <Card key={String(c.sectionId)} style={{ gap: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt variant="heading" numberOfLines={1} style={{ flex: 1 }}>{courseName(c.enrollment.section.course)}</Txt>
                <Txt variant="caption" color="textMuted">{c.summary.present}/{c.summary.total}</Txt>
              </Row>
              <CoursePlanner summary={c.summary} />
            </Card>
          ))}

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
