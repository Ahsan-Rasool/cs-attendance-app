import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext.tsx';
import { Row, Txt } from './ui.tsx';
import { canSkip, mustAttend, projectPercent, type Summary } from '../lib/attendance.ts';

/** What-if planner for ONE course; state is local to this course. */
export function CoursePlanner({ summary }: { summary: Summary }) {
  const { colors, threshold } = useTheme();
  const [miss, setMiss] = useState(0);
  const [attend, setAttend] = useState(0);
  const projected = projectPercent(summary.present, summary.total, attend, miss);
  const skip = canSkip(summary.present, summary.total, threshold);
  const need = mustAttend(summary.present, summary.total, threshold);
  const changed = miss > 0 || attend > 0;

  if (summary.total === 0) return <Txt variant="caption" color="textMuted">Nothing to plan yet — no lectures have been marked.</Txt>;
  return (
    <View style={{ gap: 12 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Stepper label="If I miss" value={miss} onChange={setMiss} />
        <Stepper label="If I attend" value={attend} onChange={setAttend} />
      </Row>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt color="textMuted">{changed ? 'You would be at' : 'You are at'}</Txt>
        <Txt variant="title" color={projected >= threshold ? 'success' : 'danger'}>{changed ? projected : summary.percent}%</Txt>
      </Row>
      <Row>
        <Ionicons name={summary.percent >= threshold ? 'shield-checkmark' : 'warning'} size={18} color={summary.percent >= threshold ? colors.success : colors.danger} />
        <Txt variant="caption" style={{ flex: 1 }}>
          {summary.percent >= threshold
            ? skip > 0 ? `You can miss ${skip} more lecture${skip === 1 ? '' : 's'} and stay at or above ${threshold}%.` : `You are exactly at the limit — don't miss the next one.`
            : `Attend the next ${need} lecture${need === 1 ? '' : 's'} in a row to reach ${threshold}%.`}
        </Txt>
      </Row>
    </View>
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
