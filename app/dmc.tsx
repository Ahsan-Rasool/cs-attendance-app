import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../src/theme/ThemeContext.tsx';
import { Card, Chip, Empty, ErrorBanner, Row, Screen, SectionTitle, Skeleton, Txt } from '../src/components/ui.tsx';
import { useTranscript } from '../src/hooks/queries.ts';
import { gradeColor, num } from '../src/lib/format.ts';

export default function Dmc() {
  const { colors } = useTheme();
  const q = useTranscript();
  const t = q.data;
  const sems = [...(t?.semesters ?? [])];
  const gpas = sems.map((s) => (s.gpa != null ? num(s.gpa) : null));
  const W = 300, H = 120;
  const pts = gpas.map((g, i) => (g == null ? null : { x: 24 + (sems.length === 1 ? (W - 48) / 2 : (i * (W - 48)) / (sems.length - 1)), y: 14 + ((4 - g) / 4) * (H - 34), g }));
  const valid = pts.filter((p): p is { x: number; y: number; g: number } => !!p);
  const path = valid.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join(' ');

  return (
    <Screen edges={[]} onRefresh={() => q.refetch()} refreshing={q.isRefetching}>
      {q.error ? <ErrorBanner error={q.error} onRetry={() => q.refetch()} /> : null}
      {q.isPending ? <><Skeleton height={110} /><Skeleton /></> : sems.length === 0 ? <Empty icon="school-outline" title="No results yet" text="Your grades will appear here once results are published." /> : (
        <>
          <Card style={{ gap: 12 }}>
            <Row style={{ justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}><Txt variant="label" color="textMuted">CGPA</Txt><Txt variant="display" color="primary">{t?.cgpa != null ? num(t.cgpa).toFixed(2) : '—'}</Txt></View>
              <View style={{ alignItems: 'center' }}><Txt variant="label" color="textMuted">Credit hours</Txt><Txt variant="display">{t?.totalCreditHours ?? '—'}</Txt></View>
            </Row>
            {valid.length > 1 ? (
              <View style={{ alignItems: 'center' }}>
                <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
                  {[4, 3, 2].map((g) => { const y = 14 + ((4 - g) / 4) * (H - 34); return <React.Fragment key={g}><Line x1={24} x2={W - 8} y1={y} y2={y} stroke={colors.border} /><SvgText x={18} y={y + 3} fontSize={9} fill={colors.textFaint} textAnchor="end">{g}.0</SvgText></React.Fragment>; })}
                  <Path d={path} stroke={colors.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
                  {valid.map((p, i) => <React.Fragment key={i}><Circle cx={p.x} cy={p.y} r={4} fill={colors.card} stroke={colors.primary} strokeWidth={2} /><SvgText x={p.x} y={p.y - 8} fontSize={9.5} fontWeight="bold" fill={colors.text} textAnchor="middle">{p.g.toFixed(2)}</SvgText></React.Fragment>)}
                </Svg>
                <Txt variant="caption" color="textFaint">GPA by semester</Txt>
              </View>
            ) : null}
          </Card>
          {[...sems].reverse().map((s) => (
            <View key={String(s.semesterId)} style={{ gap: 8 }}>
              <SectionTitle>{s.semester ?? ([s.season, s.year].filter(Boolean).join(' ') || 'Semester')}</SectionTitle>
              <Card style={{ gap: 12 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt variant="caption" color="textMuted">{s.creditHours != null ? `${s.creditHours} credit hours` : ''}</Txt>
                  {s.gpa != null ? <Chip tone="primary" label={`GPA ${num(s.gpa).toFixed(2)}`} /> : null}
                </Row>
                {s.courses.map((c, i) => {
                  const gc = gradeColor(c.grade);
                  return (
                    <Row key={i} style={{ justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}><Txt style={{ fontWeight: '600' }}>{c.courseName}</Txt><Txt variant="caption" color="textFaint">{[c.courseCode, c.sectionLabel && `Sec ${c.sectionLabel}`].filter(Boolean).join(' · ')}</Txt></View>
                      <Chip tone={gc === 'muted' ? 'muted' : gc} label={c.grade ?? '—'} />
                    </Row>
                  );
                })}
              </Card>
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
