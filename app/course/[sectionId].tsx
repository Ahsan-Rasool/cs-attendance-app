import React from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.tsx';
import { Card, Chip, Empty, ErrorBanner, ProgressBar, Row, Screen, SectionTitle, Skeleton, Txt } from '../../src/components/ui.tsx';
import { ProgressRing } from '../../src/components/charts.tsx';
import { CoursePlanner } from '../../src/components/CoursePlanner.tsx';
import { AttendanceCalendar } from '../../src/components/AttendanceCalendar.tsx';
import { useEnrollments, usePerformance, useSectionDays } from '../../src/hooks/queries.ts';
import { attendanceSummary, canSkip, mustAttend } from '../../src/lib/attendance.ts';
import { courseName, initials, num } from '../../src/lib/format.ts';

export default function CourseDetail() {
  const { sectionId } = useLocalSearchParams<{ sectionId: string }>();
  const { colors, threshold } = useTheme();
  const enr = useEnrollments();
  const att = useSectionDays(sectionId);
  const perf = usePerformance(sectionId);
  const e = enr.data?.find((x) => String(x.section.id) === String(sectionId));
  const s = e?.section;
  const sum = attendanceSummary(att.days);
  const color = sum.total === 0 ? colors.textFaint : sum.percent >= threshold ? colors.success : colors.danger;
  const refresh = () => { enr.refetch(); att.refetch(); perf.refetch(); };
  const assessments = perf.data?.assessments ?? [];
  const overall = perf.data?.overallPercentage != null ? num(perf.data.overallPercentage) : null;

  return (
    <Screen padded onRefresh={refresh} refreshing={att.isRefetching || perf.isRefetching} edges={[]}>
      <Stack.Screen options={{ title: s ? (s.course.abbreviation || s.course.courseCode || 'Course') : 'Course' }} />
      {enr.isPending ? <Skeleton height={100} /> : s ? (
        <Card style={{ gap: 10 }}>
          <Txt variant="title">{courseName(s.course)}</Txt>
          <Row style={{ flexWrap: 'wrap', gap: 6 }}>
            {s.course.courseCode ? <Chip tone="primary" label={s.course.courseCode} /> : null}
            {s.course.creditHours != null ? <Chip tone="muted" label={`${s.course.creditHours} credit hrs`} /> : null}
            {s.sectionLabel ?? s.label ? <Chip tone="muted" label={`Section ${s.sectionLabel ?? s.label}`} /> : null}
            {s.shift ? <Chip tone="muted" label={s.shift} /> : null}
          </Row>
          {s.instructor?.name ? (
            <Row>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><Txt variant="caption" color="primary" style={{ fontWeight: '800' }}>{initials(s.instructor.name)}</Txt></View>
              <View><Txt style={{ fontWeight: '600' }}>{s.instructor.name}</Txt>{s.instructor.designation ? <Txt variant="caption" color="textMuted">{s.instructor.designation}</Txt> : null}</View>
            </Row>
          ) : null}
        </Card>
      ) : null}

      <SectionTitle>Attendance</SectionTitle>
      {att.error ? <ErrorBanner error={att.error} onRetry={() => att.refetch()} /> : att.isPending ? <Skeleton height={140} /> : (
        <>
          <Card style={{ gap: 14 }}>
            <Row style={{ gap: 18 }}>
              <ProgressRing percent={sum.percent} color={color} size={100} stroke={10} />
              <View style={{ flex: 1, gap: 6 }}>
                <Txt variant="heading">{sum.present} of {sum.total} lectures</Txt>
                {sum.total === 0 ? <Txt variant="caption" color="textMuted">Nothing marked yet.</Txt>
                  : sum.percent >= threshold
                    ? <Chip tone="success" icon="checkmark-circle" label={canSkip(sum.present, sum.total, threshold) ? `Can miss ${canSkip(sum.present, sum.total, threshold)} more` : 'At the limit'} />
                    : <Chip tone="danger" icon="warning" label={`Attend next ${mustAttend(sum.present, sum.total, threshold)}`} />}
              </View>
            </Row>
          </Card>
          <Card><AttendanceCalendar days={att.days} /></Card>
          <SectionTitle>What‑if planner</SectionTitle>
          <Card><CoursePlanner summary={sum} /></Card>
        </>
      )}

      <SectionTitle>Marks</SectionTitle>
      {perf.isPending ? <Skeleton height={100} /> : perf.error ? <Card><Txt color="textMuted" variant="caption">Marks are not available for this course yet.</Txt></Card> : assessments.length === 0 ? (
        <Empty icon="document-text-outline" title="No marks published" />
      ) : (
        <Card style={{ gap: 14 }}>
          {overall != null ? (
            <Row style={{ justifyContent: 'space-between' }}>
              <View><Txt variant="label" color="textMuted">Overall</Txt><Txt variant="title">{Math.round(overall * 10) / 10}%</Txt></View>
              {perf.data?.finalGrade ? <Chip tone="primary" label={`Grade ${perf.data.finalGrade}`} /> : null}
            </Row>
          ) : null}
          {assessments.map((a) => {
            const pct = a.percentage != null ? num(a.percentage) : null;
            return (
              <View key={String(a.assessmentId)} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>{a.title}</Txt><Txt variant="caption" color="textMuted">{[a.type, a.weightage != null ? `${a.weightage}% weight` : null].filter(Boolean).join(' · ')}</Txt></View>
                  <Txt style={{ fontWeight: '700' }}>{a.totalMarksObtained ?? '—'}/{a.maxTotalMarks ?? '—'}</Txt>
                </Row>
                {pct != null ? <ProgressBar value={pct} color={pct >= 50 ? colors.success : colors.danger} /> : null}
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
