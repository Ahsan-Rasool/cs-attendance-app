import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext.tsx';
import { Card, Chip, Empty, ErrorBanner, Row, Screen, Skeleton, Txt } from '../src/components/ui.tsx';
import { useTimetable } from '../src/hooks/queries.ts';
import { classStatus, courseName, timeRange, WEEKDAYS, WEEKDAY_KEYS } from '../src/lib/format.ts';

const ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export default function Timetable() {
  const { colors } = useTheme();
  const router = useRouter();
  const q = useTimetable();
  const now = new Date();
  const todayName = WEEKDAYS[now.getDay()];
  const [day, setDay] = useState<(typeof ORDER)[number]>(todayName);
  const entries = q.data?.[WEEKDAY_KEYS[day]] ?? [];
  const counts = (d: (typeof ORDER)[number]) => (q.data?.[WEEKDAY_KEYS[d]] ?? []).filter((e) => e.type !== 'break').length;

  return (
    <Screen edges={[]} onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      <Row style={{ gap: 6 }}>
        {ORDER.map((d) => {
          const on = d === day;
          return (
            <Pressable key={d} onPress={() => setDay(d)} accessibilityRole="button" accessibilityState={{ selected: on }}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: on ? colors.primary : colors.card, borderWidth: 1, borderColor: on ? colors.primary : colors.border }}>
              <Txt variant="caption" style={{ fontWeight: '800', color: on ? colors.onPrimary : d === todayName ? colors.primary : colors.textMuted }}>{d}</Txt>
              <Txt variant="caption" style={{ color: on ? colors.onPrimary : colors.textFaint, fontSize: 11 }}>{counts(d) || '·'}</Txt>
            </Pressable>
          );
        })}
      </Row>
      {q.error ? <ErrorBanner error={q.error} onRetry={() => q.refetch()} /> : null}
      {q.isPending ? <><Skeleton /><Skeleton /></> : entries.length === 0 ? <Empty icon="cafe-outline" title="No classes" text={`Nothing scheduled on ${day}.`} /> : entries.map((e) => {
        if (e.type === 'break') return <View key={String(e.id)} style={{ alignItems: 'center', paddingVertical: 4 }}><Txt variant="caption" color="textFaint">Break · {timeRange(e.startTime, e.endTime)}</Txt></View>;
        const st = day === todayName ? classStatus(e, now) : 'upcoming';
        return (
          <Card key={String(e.id)} onPress={e.courseInstanceSectionId ? () => router.push(`/course/${e.courseInstanceSectionId}`) : undefined} tone={st === 'now' ? 'success' : undefined} style={{ gap: 6, opacity: st === 'done' ? 0.6 : 1 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="caption" color="primary" style={{ fontWeight: '800' }}>{timeRange(e.startTime, e.endTime)}</Txt>
              {st === 'now' ? <Chip tone="success" label="Now" /> : null}
            </Row>
            <Txt variant="heading">{courseName(e.course)}</Txt>
            <Txt variant="caption" color="textMuted">{[e.location, e.instructor?.name, e.sectionLabel ? `Sec ${e.sectionLabel}` : null].filter(Boolean).join(' · ')}</Txt>
          </Card>
        );
      })}
    </Screen>
  );
}
