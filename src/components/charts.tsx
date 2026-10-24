import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext.tsx';
import { Txt } from './ui.tsx';

export function ProgressRing({ percent, size = 120, stroke = 12, color, label, sub }: {
  percent: number; size?: number; stroke?: number; color: string; label?: string; sub?: string;
}) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${(c * p) / 100} ${c}`} />
        </G>
      </Svg>
      <Txt variant="title" style={{ fontSize: size / 4.2 }}>{label ?? `${Math.round(p)}%`}</Txt>
      {sub ? <Txt variant="caption" color="textMuted">{sub}</Txt> : null}
    </View>
  );
}

/** Grouped horizontal bar: one per course, with a marker at the threshold. */
export function CourseBars({ items, threshold }: { items: { key: string; label: string; percent: number; total: number }[]; threshold: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 12 }}>
      {items.map((it) => {
        const col = it.total === 0 ? colors.textFaint : it.percent >= threshold ? colors.success : colors.danger;
        return (
          <View key={it.key} style={{ gap: 5 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt variant="caption" numberOfLines={1} style={{ flex: 1, fontWeight: '600' }}>{it.label}</Txt>
              <Txt variant="caption" style={{ color: col, fontWeight: '800' }}>{it.total ? `${it.percent}%` : '—'}</Txt>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }}>
              <View style={{ width: `${it.percent}%`, height: '100%', borderRadius: 5, backgroundColor: col }} />
              <View style={{ position: 'absolute', left: `${threshold}%`, top: -3, bottom: -3, width: 2, backgroundColor: colors.warning, borderRadius: 1 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
