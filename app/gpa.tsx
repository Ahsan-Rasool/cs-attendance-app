import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext.tsx';
import { Card, Chip, Row, Screen, SectionTitle, Txt } from '../src/components/ui.tsx';
import { useEnrolled, useTranscript } from '../src/hooks/queries.ts';
import { courseName, num } from '../src/lib/format.ts';
import { GRADES, projectedCgpa, requiredGpa, semesterGpa, type Grade } from '../src/lib/gpa.ts';

interface Row_ { key: string; name: string; credits: number; grade: Grade | null; manual?: boolean }

export default function GpaCalculator() {
  const { colors } = useTheme();
  const { enrolled } = useEnrolled();
  const tr = useTranscript();
  const [rows, setRows] = useState<Row_[]>([]);
  const [target, setTarget] = useState('');

  // Seed once from the current enrolments; the student then edits freely.
  useEffect(() => {
    setRows((cur) => {
      if (cur.some((r) => !r.manual) || enrolled.length === 0) return cur;
      return [...enrolled.map((e) => ({ key: String(e.section.id), name: courseName(e.section.course), credits: e.section.course.creditHours ?? 3, grade: null })), ...cur];
    });
  }, [enrolled]);

  const cgpa = tr.data?.cgpa != null ? num(tr.data.cgpa) : null;
  const done = tr.data?.totalCreditHours ?? 0;
  const items = rows.map((r) => ({ credits: r.credits, grade: r.grade }));
  const sem = semesterGpa(items);
  const proj = cgpa != null ? projectedCgpa(cgpa, done, items) : null;
  const totalNew = rows.reduce((a, r) => a + r.credits, 0);
  const t = parseFloat(target);
  const need = cgpa != null && Number.isFinite(t) ? requiredGpa(cgpa, done, totalNew, t) : null;
  const patch = (key: string, p: Partial<Row_>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));

  return (
    <Screen edges={[]}>
      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-around' }}>
          <Big label="This semester" value={sem.gpa != null ? sem.gpa.toFixed(2) : '—'} />
          <Big label="Projected CGPA" value={proj != null ? proj.toFixed(2) : cgpa != null ? cgpa.toFixed(2) : '—'} accent />
        </Row>
        <Txt variant="caption" color="textFaint" style={{ textAlign: 'center' }}>
          {cgpa != null ? `Current CGPA ${cgpa.toFixed(2)} over ${done} credit hours.` : 'Current CGPA not available — projection needs your transcript.'} Pick a grade for each course to see the effect.
        </Txt>
      </Card>

      <SectionTitle>Courses this semester</SectionTitle>
      {rows.length === 0 ? <Card><Txt color="textMuted">No enrolled courses found. Add courses below to plan.</Txt></Card> : rows.map((r) => (
        <Card key={r.key} style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="heading" numberOfLines={1} style={{ flex: 1 }}>{r.name}</Txt>
            <Row style={{ gap: 8 }}>
              <Pressable accessibilityLabel="Fewer credit hours" hitSlop={8} onPress={() => patch(r.key, { credits: Math.max(1, r.credits - 1) })}><Ionicons name="remove-circle" size={24} color={colors.primary} /></Pressable>
              <Txt style={{ fontWeight: '700', minWidth: 42, textAlign: 'center' }}>{r.credits} cr</Txt>
              <Pressable accessibilityLabel="More credit hours" hitSlop={8} onPress={() => patch(r.key, { credits: Math.min(6, r.credits + 1) })}><Ionicons name="add-circle" size={24} color={colors.primary} /></Pressable>
              {r.manual ? <Pressable accessibilityLabel="Remove course" hitSlop={8} onPress={() => setRows((x) => x.filter((y) => y.key !== r.key))}><Ionicons name="trash" size={20} color={colors.danger} /></Pressable> : null}
            </Row>
          </Row>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {GRADES.map((g) => {
              const on = r.grade === g;
              return (
                <Pressable key={g} onPress={() => patch(r.key, { grade: on ? null : g })} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: on ? colors.primary : colors.cardAlt, borderWidth: 1, borderColor: on ? colors.primary : colors.border }}>
                  <Txt variant="caption" style={{ fontWeight: '800', color: on ? colors.onPrimary : colors.textMuted }}>{g}</Txt>
                </Pressable>
              );
            })}
          </ScrollView>
        </Card>
      ))}
      <Pressable onPress={() => setRows((x) => [...x, { key: `m${Date.now()}`, name: `Extra course ${x.filter((y) => y.manual).length + 1}`, credits: 3, grade: null, manual: true }])}>
        <Row style={{ justifyContent: 'center' }}><Ionicons name="add-circle" size={20} color={colors.primary} /><Txt color="primary" style={{ fontWeight: '700' }}>Add a course</Txt></Row>
      </Pressable>

      <SectionTitle>Reach a target CGPA</SectionTitle>
      <Card style={{ gap: 10 }}>
        <TextInput value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="Target CGPA, e.g. 3.5" placeholderTextColor={colors.textFaint}
          style={{ backgroundColor: colors.cardAlt, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.text, fontSize: 15 }} />
        {cgpa == null ? <Txt variant="caption" color="textMuted">Needs your transcript CGPA.</Txt>
          : need == null ? <Txt variant="caption" color="textMuted">Enter a target (and have at least one course) to see the GPA you need this semester.</Txt>
          : need > 4 ? <Chip tone="danger" icon="close-circle" label={`Needs ${need.toFixed(2)} — not reachable in one semester`} />
          : need <= 0 ? <Chip tone="success" icon="checkmark-circle" label="Already safe — any passing result keeps you above it" />
          : <Chip tone="primary" icon="flag" label={`You need about ${need.toFixed(2)} GPA over ${totalNew} credits`} />}
      </Card>
      <Txt variant="caption" color="textFaint" style={{ textAlign: 'center' }}>
        Estimate on the standard 4.0 scale (A = 4.0, A- = 3.67, B+ = 3.33 …). Your university's official scale may differ.
      </Txt>
    </Screen>
  );
}

function Big({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <View style={{ alignItems: 'center' }}><Txt variant="label" color="textMuted">{label}</Txt><Txt variant="display" color={accent ? 'primary' : 'text'}>{value}</Txt></View>;
}
