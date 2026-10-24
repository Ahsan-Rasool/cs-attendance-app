import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext.tsx';
import { Txt } from './ui.tsx';
import { MONTHS } from '../lib/format.ts';
import { localDateKey, type DayAttendance, type DayStatus } from '../lib/attendance.ts';

// When several lectures fall on one day the "worst" status wins.
const PRIORITY: DayStatus[] = ['absent', 'unmarked', 'in-progress', 'present', 'upcoming', 'cancelled'];

export function useStatusColors() {
  const { colors } = useTheme();
  return {
    present: colors.success, absent: colors.danger, unmarked: colors.warning,
    cancelled: colors.textFaint, upcoming: colors.primary, 'in-progress': colors.primary,
  } as Record<DayStatus, string>;
}

export const STATUS_LABEL: Record<DayStatus, string> = {
  present: 'Present', absent: 'Absent', unmarked: 'Not marked', cancelled: 'Cancelled', upcoming: 'Upcoming', 'in-progress': 'In progress',
};

export function Legend({ only }: { only?: DayStatus[] }) {
  const { colors } = useTheme();
  const sc = useStatusColors();
  const items = only ?? (['present', 'absent', 'unmarked', 'cancelled'] as DayStatus[]);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {items.map((s) => (
        <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: sc[s] }} />
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>{STATUS_LABEL[s]}</Text>
        </View>
      ))}
    </View>
  );
}

export function AttendanceCalendar({ days }: { days: DayAttendance[] }) {
  const { colors } = useTheme();
  const sc = useStatusColors();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const byDate = useMemo(() => {
    const m = new Map<string, DayStatus>();
    for (const d of days) {
      const cur = m.get(d.date);
      if (!cur || PRIORITY.indexOf(d.status) < PRIORITY.indexOf(cur)) m.set(d.date, d.status);
    }
    return m;
  }, [days]);

  const y = month.getFullYear(), mo = month.getMonth();
  const lead = (new Date(y, mo, 1).getDay() + 6) % 7; // Monday first
  const count = new Date(y, mo + 1, 0).getDate();
  const today = localDateKey(new Date());
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const shift = (n: number) => setMonth(new Date(y, mo + n, 1));

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable accessibilityLabel="Previous month" onPress={() => shift(-1)} hitSlop={12}><Ionicons name="chevron-back" size={22} color={colors.primary} /></Pressable>
        <Txt variant="heading">{MONTHS[mo]} {y}</Txt>
        <Pressable accessibilityLabel="Next month" onPress={() => shift(1)} hitSlop={12}><Ionicons name="chevron-forward" size={22} color={colors.primary} /></Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Text key={i} style={{ flex: 1, textAlign: 'center', color: colors.textFaint, fontSize: 11, fontWeight: '700' }}>{d}</Text>)}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 4 }}>
          {cells.slice(r * 7, r * 7 + 7).map((n, i) => {
            if (!n) return <View key={i} style={{ flex: 1, aspectRatio: 1 }} />;
            const key = `${y}-${String(mo + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
            const st = byDate.get(key);
            const isToday = key === today;
            return (
              <View key={i} style={{ flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: st ? sc[st] + (st === 'upcoming' || st === 'cancelled' ? '33' : 'ff') : 'transparent', borderWidth: isToday ? 2 : 0, borderColor: colors.primary }}>
                <Text style={{ fontSize: 12.5, fontWeight: st ? '700' : '500', color: st && st !== 'upcoming' && st !== 'cancelled' ? '#fff' : st ? colors.text : colors.textMuted }}>{n}</Text>
              </View>
            );
          })}
        </View>
      ))}
      <Legend />
    </View>
  );
}
