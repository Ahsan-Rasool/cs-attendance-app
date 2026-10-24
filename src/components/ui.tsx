import React from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
  type StyleProp, type TextStyle, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type Palette } from '../theme/ThemeContext.tsx';

type ColorKey = keyof Omit<Palette, 'chart'>;
type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'label';

const SIZES: Record<Variant, TextStyle> = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '700', letterSpacing: -0.2 },
  heading: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14.5, lineHeight: 21 },
  caption: { fontSize: 12.5, lineHeight: 17 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
};

export function Txt({ variant = 'body', color = 'text', style, children, numberOfLines }: {
  variant?: Variant; color?: ColorKey; style?: StyleProp<TextStyle>; children?: React.ReactNode; numberOfLines?: number;
}) {
  const { colors } = useTheme();
  return <Text numberOfLines={numberOfLines} style={[{ color: colors[color] as string }, SIZES[variant], style]}>{children}</Text>;
}

export function Card({ children, style, onPress, tone }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tone?: 'danger' | 'warning' | 'success';
}) {
  const { colors } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.card, borderColor: tone ? colors[tone] : colors.border,
    borderWidth: StyleSheet.hairlineWidth * (tone ? 3 : 2), borderRadius: 18, padding: 16,
  };
  if (onPress) return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style]}>{children}</Pressable>;
  return <View style={[base, style]}>{children}</View>;
}

export function Screen({ children, onRefresh, refreshing, scroll = true, padded = true, edges = ['top'] }: {
  children: React.ReactNode; onRefresh?: () => void; refreshing?: boolean; scroll?: boolean; padded?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ padding: padded ? 16 : 0, paddingBottom: 32, gap: 14 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} progressBackgroundColor={colors.card} /> : undefined}
        >{children}</ScrollView>
      ) : <View style={{ flex: 1, padding: padded ? 16 : 0 }}>{children}</View>}
    </SafeAreaView>
  );
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', icon }: {
  title: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger'; icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.dangerSoft : 'transparent';
  const fg = variant === 'primary' ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: variant === 'ghost' ? 1 : 0, borderColor: colors.border })}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, tone = 'primary', icon }: { label: string; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'muted'; icon?: keyof typeof Ionicons.glyphMap }) {
  const { colors } = useTheme();
  const map = {
    primary: [colors.primarySoft, colors.primary], success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning], danger: [colors.dangerSoft, colors.danger], muted: [colors.cardAlt, colors.textMuted],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
      {icon ? <Ionicons name={icon} size={12} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 11.5, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function ErrorBanner({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { colors } = useTheme();
  const msg = error instanceof Error ? error.message : 'Something went wrong';
  return (
    <Card tone="danger" style={{ backgroundColor: colors.dangerSoft }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Ionicons name="alert-circle" size={20} color={colors.danger} />
        <View style={{ flex: 1 }}><Txt color="danger" variant="body">{msg}</Txt></View>
        {onRetry ? <Pressable onPress={onRetry}><Txt color="danger" variant="heading">Retry</Txt></Pressable> : null}
      </View>
    </Card>
  );
}

export function Skeleton({ height = 80, style }: { height?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height, borderRadius: 16, backgroundColor: colors.cardAlt, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }, style]} />;
}

export function Empty({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 36, gap: 8 }}>
      <Ionicons name={icon} size={36} color={colors.textFaint} />
      <Txt variant="heading">{title}</Txt>
      {text ? <Txt color="textMuted" variant="caption" style={{ textAlign: 'center' }}>{text}</Txt> : null}
    </View>
  );
}

export function SectionTitle({ children, action, onAction }: { children: React.ReactNode; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
      <Txt variant="heading">{children}</Txt>
      {action ? <Pressable onPress={onAction} hitSlop={10}><Txt variant="caption" color="primary" style={{ fontWeight: '700' }}>{action}</Txt></Pressable> : null}
    </View>
  );
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.cardAlt, borderRadius: 12, padding: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: on ? colors.primary : 'transparent' }}>
            <Text style={{ color: on ? colors.onPrimary : colors.textMuted, fontWeight: '700', fontSize: 13 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressBar({ value, color, marker }: { value: number; color: string; marker?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.cardAlt, overflow: 'visible', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
      <View style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
      {marker != null ? <View style={{ position: 'absolute', left: `${marker}%`, top: -3, bottom: -3, width: 2, backgroundColor: colors.textFaint, borderRadius: 1 }} /> : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>{children}</View>;
}

export function Spinner() {
  const { colors } = useTheme();
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} size="large" /></View>;
}
