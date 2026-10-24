import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext.tsx';
import { useAuth } from '../../src/auth/AuthContext.tsx';
import { Card, Chip, ErrorBanner, Row, Screen, SectionTitle, Skeleton, Txt } from '../../src/components/ui.tsx';
import { ProgressRing, Sparkline } from '../../src/components/charts.tsx';
import { useAttendanceOverview, useTimetable, useTranscript } from '../../src/hooks/queries.ts';
import { canSkip, mustAttend, presentStreak, riskOf } from '../../src/lib/attendance.ts';
import { classStatus, courseName, courseShort, degreeLabel, greeting, initials, num, semesterLabel, timeRange, WEEKDAY_KEYS, WEEKDAYS } from '../../src/lib/format.ts';

export default function Home() {
  const { colors, isDark, setMode, threshold } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const ov = useAttendanceOverview();
  const tt = useTimetable();
  const tr = useTranscript();

  const now = new Date();
  const todayKey = WEEKDAY_KEYS[WEEKDAYS[now.getDay()]];
  const today = useMemo(() => (tt.data?.[todayKey] ?? []).filter((e) => e.type !== 'break'), [tt.data, todayKey]);
  const nextUp = today.find((e) => classStatus(e, now) !== 'done');

  const atRisk = ov.courses.filter((c) => riskOf(c.summary, threshold) === 'danger' || riskOf(c.summary, threshold) === 'warning')
    .sort((a, b) => a.summary.percent - b.summary.percent);
  const ringColor = ov.overall.total === 0 ? colors.textFaint : ov.overall.percent >= threshold ? colors.success : colors.danger;
  const allDays = ov.courses.flatMap((c) => c.days);
  const streak = presentStreak(allDays);
  const cgpa = tr.data?.cgpa != null ? num(tr.data.cgpa).toFixed(2) : '—';
  const refresh = () => { ov.refetch(); tt.refetch(); tr.refetch(); };
  const skip = canSkip(ov.overall.present, ov.overall.total, threshold);
  const need = mustAttend(ov.overall.present, ov.overall.total, threshold);

  return (
    <Screen onRefresh={refresh} refreshing={ov.refetching || tt.isRefetching}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row style={{ flex: 1 }}>
          <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="heading" style={{ color: colors.onPrimary }}>{initials(user?.name)}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="caption" color="textMuted">{greeting()},</Txt>
            <Txt variant="title" numberOfLines={1}>{user?.name?.split(' ')[0] ?? 'Student'}</Txt>
          </View>
        </Row>
        <Pressable accessibilityLabel="Toggle dark mode" hitSlop={10} onPress={() => setMode(isDark ? 'light' : 'dark')}
          style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={colors.primary} />
        </Pressable>
      </Row>
      {user?.registrationNo || degreeLabel(user) ? (
        <Txt variant="caption" color="textFaint">{[user?.registrationNo, degreeLabel(user), semesterLabel(user)].filter(Boolean).join(' · ')}</Txt>
      ) : null}

      {ov.error ? <ErrorBanner error={ov.error} onRetry={refresh} /> : null}

      {ov.pending ? <Skeleton height={170} /> : (
        <Card onPress={() => router.push('/attendance')}>
          <Row style={{ gap: 18 }}>
            <ProgressRing percent={ov.overall.percent} color={ringColor} size={118} sub="overall" />
            <View style={{ flex: 1, gap: 8 }}>
              <Txt variant="label" color="textMuted">Attendance</Txt>
              <Txt variant="body" style={{ fontWeight: '600' }}>
                {ov.overall.total === 0 ? 'No lectures marked yet.' : `${ov.overall.present} of ${ov.overall.total} lectures attended`}
              </Txt>
              {ov.overall.total > 0 ? (
                ov.overall.percent >= threshold
                  ? <Chip tone="success" icon="checkmark-circle" label={skip > 0 ? `Can miss ${skip} more` : 'Right on the limit'} />
                  : <Chip tone="danger" icon="warning" label={`Attend next ${need} to reach ${threshold}%`} />
              ) : null}
              <Row style={{ gap: 12 }}>
                <Sparkline values={ov.trend.map((t) => t.percent)} color={ringColor} />
                {streak > 1 ? <Chip tone="primary" icon="flame" label={`${streak} in a row`} /> : null}
              </Row>
            </View>
          </Row>
        </Card>
      )}

      <Row style={{ gap: 10, alignItems: 'stretch' }}>
        <Stat icon="book" label="Courses" value={String(ov.enrolled.length)} onPress={() => router.push('/courses')} />
        <Stat icon="school" label="CGPA" value={cgpa} onPress={() => router.push('/dmc')} />
        <Stat icon="alert-circle" label="At risk" value={String(atRisk.length)} tone={atRisk.length ? 'danger' : 'success'} onPress={() => router.push('/attendance')} />
      </Row>

      <SectionTitle action="Full timetable" onAction={() => router.push('/timetable')}>Today's classes</SectionTitle>
      {tt.isPending ? <Skeleton height={90} /> : tt.error ? <ErrorBanner error={tt.error} onRetry={() => tt.refetch()} /> : today.length === 0 ? (
        <Card><Row><Ionicons name="cafe" size={22} color={colors.textFaint} /><Txt color="textMuted">No classes today. Enjoy the break!</Txt></Row></Card>
      ) : (
        <Card style={{ gap: 14 }}>
          {today.map((e) => {
            const st = classStatus(e, now);
            const isNext = nextUp?.id === e.id;
            return (
              <Pressable key={String(e.id)} disabled={!e.courseInstanceSectionId} onPress={() => router.push(`/course/${e.courseInstanceSectionId}`)}>
                <Row style={{ opacity: st === 'done' ? 0.55 : 1 }}>
                  <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: st === 'now' ? colors.success : isNext ? colors.primary : colors.border }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="heading" numberOfLines={1}>{courseName(e.course)}</Txt>
                    <Txt variant="caption" color="textMuted">{timeRange(e.startTime, e.endTime)}{e.location ? ` · ${e.location}` : ''}</Txt>
                  </View>
                  {st === 'now' ? <Chip tone="success" label="Now" /> : isNext ? <Chip tone="primary" label="Next" /> : st === 'done' ? <Chip tone="muted" label="Done" /> : null}
                </Row>
              </Pressable>
            );
          })}
        </Card>
      )}

      {atRisk.length > 0 ? (
        <>
          <SectionTitle action="Planner" onAction={() => router.push('/attendance')}>Needs attention</SectionTitle>
          <Card style={{ gap: 14 }}>
            {atRisk.slice(0, 4).map((c) => {
              const danger = riskOf(c.summary, threshold) === 'danger';
              return (
                <Pressable key={String(c.sectionId)} onPress={() => router.push(`/course/${c.sectionId}`)}>
                  <Row>
                    <View style={{ flex: 1 }}>
                      <Txt variant="heading" numberOfLines={1}>{courseShort(c.enrollment.section.course)}</Txt>
                      <Txt variant="caption" color="textMuted">
                        {danger ? `Attend the next ${mustAttend(c.summary.present, c.summary.total, threshold)} lectures to reach ${threshold}%` : 'At the limit — one more absence drops you below'}
                      </Txt>
                    </View>
                    <Txt variant="title" color={danger ? 'danger' : 'warning'}>{c.summary.percent}%</Txt>
                  </Row>
                </Pressable>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ icon, label, value, tone, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tone?: 'danger' | 'success'; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} style={{ flex: 1, padding: 14, gap: 4 }}>
      <Ionicons name={icon} size={18} color={tone ? colors[tone] : colors.primary} />
      <Txt variant="title" color={tone ?? 'text'}>{value}</Txt>
      <Txt variant="caption" color="textMuted">{label}</Txt>
    </Card>
  );
}
