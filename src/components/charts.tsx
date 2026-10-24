import React, { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext.tsx';
import { Txt } from './ui.tsx';
import { MONTHS } from '../lib/format.ts';
import type { TrendPoint } from '../lib/attendance.ts';

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

const fmtWeek = (k: string) => { const [, m, d] = k.split('-').map(Number); return `${d} ${MONTHS[m - 1]}`; };

/** Cumulative attendance % per week, with a dashed line at the threshold. */
export function TrendChart({ points, threshold, height = 190 }: { points: TrendPoint[]; threshold: number; height?: number }) {
  const { colors } = useTheme();
  const [w, setW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);
  const padL = 30, padR = 14, padT = 12, padB = 24;
  const lo = Math.max(0, Math.floor((Math.min(...points.map((p) => p.percent), threshold) - 10) / 10) * 10);
  const hi = 100;
  const x = (i: number) => padL + (points.length === 1 ? (w - padL - padR) / 2 : (i * (w - padL - padR)) / (points.length - 1));
  const y = (v: number) => padT + ((hi - v) / (hi - lo)) * (height - padT - padB);
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.percent).toFixed(1)}`).join(' ');
  const area = points.length > 1 ? `${line} L${x(points.length - 1).toFixed(1)},${y(lo)} L${x(0).toFixed(1)},${y(lo)} Z` : '';
  const last = points[points.length - 1];
  const above = last ? last.percent >= threshold : true;
  const stroke = above ? colors.success : colors.danger;
  const ticks = [lo, lo + (hi - lo) / 2, hi];
  return (
    <View>
    <View onLayout={onLayout} style={{ height }}>
      {w > 0 && points.length > 0 ? (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity={0.28} />
              <Stop offset="1" stopColor={stroke} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {ticks.map((t) => (
            <G key={t}>
              <Line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke={colors.border} strokeWidth={1} />
              <SvgText x={padL - 6} y={y(t) + 4} fontSize={10} fill={colors.textFaint} textAnchor="end">{Math.round(t)}</SvgText>
            </G>
          ))}
          <Line x1={padL} x2={w - padR} y1={y(threshold)} y2={y(threshold)} stroke={colors.warning} strokeWidth={1.5} strokeDasharray="5 4" />
          {area ? <Path d={area} fill="url(#g)" /> : null}
          <Path d={line} stroke={stroke} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => <Circle key={p.label} cx={x(i)} cy={y(p.percent)} r={i === points.length - 1 ? 5 : 3} fill={i === points.length - 1 ? stroke : colors.card} stroke={stroke} strokeWidth={2} />)}
          {last ? <SvgText x={Math.min(x(points.length - 1), w - padR - 14)} y={y(last.percent) + (last.percent >= hi - 8 || last.percent < threshold ? 20 : -10)} fontSize={11} fontWeight="bold" fill={stroke} textAnchor="middle">{last.percent}%</SvgText> : null}
          <SvgText x={x(0)} y={height - 6} fontSize={10} fill={colors.textFaint} textAnchor="start">{fmtWeek(points[0].label)}</SvgText>
          {points.length > 1 ? <SvgText x={x(points.length - 1)} y={height - 6} fontSize={10} fill={colors.textFaint} textAnchor="end">{fmtWeek(last.label)}</SvgText> : null}
        </Svg>
      ) : null}
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <Svg width={22} height={4}><Line x1={0} x2={22} y1={2} y2={2} stroke={colors.warning} strokeWidth={2} strokeDasharray="5 3" /></Svg>
      <Txt variant="caption" color="textMuted">{threshold}% minimum</Txt>
    </View>
    </View>
  );
}

/** Tiny line for cards. */
export function Sparkline({ values, color, width = 90, height = 34 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (values.length < 2) return <View style={{ width, height }} />;
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${(i * (width - 4)) / (values.length - 1) + 2},${height - 4 - ((v - lo) / span) * (height - 8)}`).join(' ');
  return <Svg width={width} height={height}><Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
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
