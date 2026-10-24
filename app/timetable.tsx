import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext.tsx';
import { useAuth } from '../src/auth/AuthContext.tsx';
import { Button, Card, Chip, Empty, ErrorBanner, Row, Screen, Skeleton, Txt } from '../src/components/ui.tsx';
import { useTimetable } from '../src/hooks/queries.ts';
import { useCustomClasses } from '../src/hooks/useCustomClasses.tsx';
import { DAY_KEYS, mergeTimetable, validateClass, type DayKey } from '../src/lib/customTimetable.ts';
import { classStatus, courseName, timeRange, WEEKDAYS, WEEKDAY_KEYS } from '../src/lib/format.ts';
import { buildTimetableHtml, sharePdf } from '../src/lib/pdf.ts';

const ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export default function Timetable() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const q = useTimetable();
  const { classes, add, remove } = useCustomClasses();
  const now = new Date();
  const todayName = WEEKDAYS[now.getDay()];
  const [day, setDay] = useState<(typeof ORDER)[number]>(todayName);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const week = mergeTimetable(q.data, classes);
  const entries = week[WEEKDAY_KEYS[day]];
  const counts = (d: (typeof ORDER)[number]) => week[WEEKDAY_KEYS[d]].filter((e) => e.type !== 'break').length;

  const exportPdf = async () => {
    setBusy(true);
    try { await sharePdf(buildTimetableHtml(`${user?.name ?? ''}${user?.registrationNo ? ` · ${user.registrationNo}` : ''}`, week), 'timetable.pdf'); }
    catch (e) { Alert.alert('Could not create PDF', e instanceof Error ? e.message : 'Unknown error'); }
    finally { setBusy(false); }
  };
  const confirmRemove = (id: string) => Alert.alert('Remove this class?', 'It is only stored on this phone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => remove(id) }]);

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
      <Row style={{ gap: 10 }}>
        <View style={{ flex: 1 }}><Button title="Add class" icon="add-circle" onPress={() => setAdding(true)} /></View>
        <View style={{ flex: 1 }}><Button title="Download PDF" icon="download" variant="ghost" onPress={exportPdf} loading={busy} /></View>
      </Row>
      {q.error && classes.length === 0 ? <ErrorBanner error={q.error} onRetry={() => q.refetch()} /> : null}
      {q.isPending && classes.length === 0 ? <><Skeleton /><Skeleton /></> : entries.length === 0 ? <Empty icon="cafe-outline" title="No classes" text={`Nothing scheduled on ${day}. Tap “Add class” to add your own.`} /> : entries.map((e) => {
        if (e.type === 'break') return <View key={String(e.id)} style={{ alignItems: 'center', paddingVertical: 4 }}><Txt variant="caption" color="textFaint">Break · {timeRange(e.startTime, e.endTime)}</Txt></View>;
        const st = day === todayName ? classStatus(e, now) : 'upcoming';
        const custom = !!e.custom;
        return (
          <Card key={String(e.id)} onPress={!custom && e.courseInstanceSectionId ? () => router.push(`/course/${e.courseInstanceSectionId}`) : undefined} tone={st === 'now' ? 'success' : undefined} style={{ gap: 6, opacity: st === 'done' ? 0.6 : 1 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="caption" color="primary" style={{ fontWeight: '800' }}>{timeRange(e.startTime, e.endTime)}</Txt>
              <Row style={{ gap: 8 }}>
                {st === 'now' ? <Chip tone="success" label="Now" /> : null}
                {custom ? <Chip tone="warning" label="My class" /> : null}
                {custom ? <Pressable accessibilityLabel="Remove class" hitSlop={10} onPress={() => confirmRemove(String(e.id).replace('custom-', ''))}><Ionicons name="trash" size={18} color={colors.danger} /></Pressable> : null}
              </Row>
            </Row>
            <Txt variant="heading">{courseName(e.course)}</Txt>
            <Txt variant="caption" color="textMuted">{[e.location, e.instructor?.name, e.sectionLabel ? `Sec ${e.sectionLabel}` : null, e.note].filter(Boolean).join(' · ')}</Txt>
          </Card>
        );
      })}
      <AddClassModal visible={adding} initialDay={WEEKDAY_KEYS[day]} onClose={() => setAdding(false)} onSave={(c) => { add(c); setAdding(false); setDay(ORDER.find((d) => WEEKDAY_KEYS[d] === c.day) ?? day); }} />
    </Screen>
  );
}

function AddClassModal({ visible, initialDay, onClose, onSave }: { visible: boolean; initialDay: DayKey; onClose: () => void; onSave: (c: { day: DayKey; title: string; startTime: string; endTime: string; location?: string; note?: string }) => void }) {
  const { colors } = useTheme();
  const [d, setD] = useState<DayKey>(initialDay);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [room, setRoom] = useState('');
  const [error, setError] = useState<string | null>(null);
  React.useEffect(() => { if (visible) { setD(initialDay); setTitle(''); setStart(''); setEnd(''); setRoom(''); setError(null); } }, [visible, initialDay]);
  const input = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 12, color: colors.text, fontSize: 15 } as const;
  const submit = () => {
    const err = validateClass({ title, startTime: start, endTime: end });
    if (err) return setError(err);
    onSave({ day: d, title, startTime: start, endTime: end, location: room.trim() || undefined });
  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000066' }}>
        <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 18, gap: 12, maxHeight: '90%' }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="title">Add a class</Txt>
            <Pressable onPress={onClose} accessibilityLabel="Close" hitSlop={10}><Ionicons name="close" size={24} color={colors.textMuted} /></Pressable>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {DAY_KEYS.map((k) => (
                <Pressable key={k} onPress={() => setD(k)} accessibilityRole="button" accessibilityState={{ selected: d === k }}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: d === k ? colors.primary : colors.card, borderWidth: 1, borderColor: d === k ? colors.primary : colors.border }}>
                  <Txt variant="caption" style={{ fontWeight: '700', color: d === k ? colors.onPrimary : colors.textMuted }}>{k[0].toUpperCase() + k.slice(1, 3)}</Txt>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput value={title} onChangeText={setTitle} placeholder="Class / activity name" placeholderTextColor={colors.textFaint} style={input} />
            <Row style={{ gap: 10 }}>
              <TextInput value={start} onChangeText={setStart} placeholder="Start 09:00" placeholderTextColor={colors.textFaint} keyboardType="numbers-and-punctuation" style={[input, { flex: 1 }]} />
              <TextInput value={end} onChangeText={setEnd} placeholder="End 10:30" placeholderTextColor={colors.textFaint} keyboardType="numbers-and-punctuation" style={[input, { flex: 1 }]} />
            </Row>
            <TextInput value={room} onChangeText={setRoom} placeholder="Room (optional)" placeholderTextColor={colors.textFaint} style={input} />
            <Txt variant="caption" color="textFaint">Times use the 24-hour clock. Saved on this phone only.</Txt>
            {error ? <Txt color="danger" variant="caption">{error}</Txt> : null}
            <Button title="Save class" icon="checkmark" onPress={submit} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
