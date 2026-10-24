import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.tsx';
import { Card, Chip, Empty, ErrorBanner, Row, Screen, Skeleton, Txt } from '../../src/components/ui.tsx';
import { ProgressBar } from '../../src/components/ui.tsx';
import { useAttendanceOverview } from '../../src/hooks/queries.ts';
import { riskOf } from '../../src/lib/attendance.ts';
import { courseName } from '../../src/lib/format.ts';

export default function Courses() {
  const { colors, threshold } = useTheme();
  const router = useRouter();
  const ov = useAttendanceOverview();
  const [q, setQ] = useState('');
  const list = ov.courses.filter((c) => {
    const s = c.enrollment.section;
    return `${s.course.name} ${s.course.courseCode ?? ''} ${s.instructor?.name ?? ''}`.toLowerCase().includes(q.trim().toLowerCase());
  });
  const credits = ov.courses.reduce((a, c) => a + (c.enrollment.section.course.creditHours ?? 0), 0);

  return (
    <Screen onRefresh={ov.refetch} refreshing={ov.refetching}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="title">My courses</Txt>
        {credits ? <Chip tone="primary" label={`${credits} credit hrs`} /> : null}
      </Row>
      <TextInput value={q} onChangeText={setQ} placeholder="Search courses or teachers" placeholderTextColor={colors.textFaint}
        style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, color: colors.text }} />
      {ov.error ? <ErrorBanner error={ov.error} onRetry={ov.refetch} /> : null}
      {ov.pending ? <><Skeleton /><Skeleton /><Skeleton /></> : list.length === 0 ? (
        <Empty icon="book-outline" title={q ? 'No matches' : 'No enrolled courses'} />
      ) : list.map((c) => {
        const s = c.enrollment.section;
        const risk = riskOf(c.summary, threshold);
        const col = risk === 'danger' ? colors.danger : risk === 'warning' ? colors.warning : risk === 'safe' ? colors.success : colors.textFaint;
        return (
          <Card key={String(c.sectionId)} onPress={() => router.push(`/course/${c.sectionId}`)} style={{ gap: 10 }}>
            <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="heading" numberOfLines={2}>{courseName(s.course)}</Txt>
                <Txt variant="caption" color="textMuted">{[s.course.courseCode, s.sectionLabel ?? s.label ? `Section ${s.sectionLabel ?? s.label}` : null].filter(Boolean).join(' · ')}</Txt>
                {s.instructor?.name ? <Txt variant="caption" color="textFaint">{s.instructor.name}</Txt> : null}
              </View>
              <Txt variant="title" style={{ color: col }}>{c.summary.total ? `${c.summary.percent}%` : '—'}</Txt>
            </Row>
            <ProgressBar value={c.summary.percent} color={col} marker={threshold} />
            <Txt variant="caption" color="textMuted">{c.summary.total ? `${c.summary.present}/${c.summary.total} lectures attended` : 'No lectures marked yet'}</Txt>
          </Card>
        );
      })}
    </Screen>
  );
}
