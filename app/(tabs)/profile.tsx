import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeMode } from '../../src/theme/ThemeContext.tsx';
import { useAuth } from '../../src/auth/AuthContext.tsx';
import { Button, Card, Chip, Row, Screen, SectionTitle, Segmented, Txt } from '../../src/components/ui.tsx';
import { batchLabel, degreeLabel, formatDate, initials, sectionLabelOf, semesterLabel } from '../../src/lib/format.ts';

export default function Profile() {
  const { colors, mode, setMode, threshold, setThreshold } = useTheme();
  const { user, signOut, demo } = useAuth();
  const router = useRouter();
  const rows: [string, string | undefined][] = [
    ['Registration no.', user?.registrationNo], ['Email', user?.email], ['Degree', degreeLabel(user)], ['Department', user?.departmentName],
    ['Batch', batchLabel(user)], ['Section', sectionLabelOf(user)], ['Semester', semesterLabel(user)],
    ['Credit hours', user?.totalCreditHours != null ? String(user.totalCreditHours) : undefined],
    ['Contact hours', user?.totalContactHours != null ? String(user.totalContactHours) : undefined],
    ['Member since', formatDate(user?.createdAt) || undefined],
  ];
  const confirmLogout = () => Alert.alert('Sign out?', 'You will need to sign in again.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => { signOut(); } }]);

  return (
    <Screen>
      <Card style={{ alignItems: 'center', gap: 6, paddingVertical: 22 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="title" style={{ color: colors.onPrimary }}>{initials(user?.name)}</Txt>
        </View>
        <Txt variant="title">{user?.name}</Txt>
        <Row>{user?.role ? <Chip tone="primary" label={user.role} /> : null}{demo ? <Chip tone="warning" label="Demo data" /> : null}</Row>
      </Card>

      <SectionTitle>Appearance</SectionTitle>
      <Card style={{ gap: 12 }}>
        <Segmented<ThemeMode> value={mode} onChange={setMode} options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt variant="heading">Attendance minimum</Txt>
            <Txt variant="caption" color="textMuted">Used for warnings, graphs and the planner</Txt>
          </View>
          <Row style={{ gap: 12 }}>
            <Pressable accessibilityLabel="Lower minimum" onPress={() => setThreshold(threshold - 5)} hitSlop={8}><Ionicons name="remove-circle" size={28} color={colors.primary} /></Pressable>
            <Txt variant="title" style={{ minWidth: 52, textAlign: 'center' }}>{threshold}%</Txt>
            <Pressable accessibilityLabel="Raise minimum" onPress={() => setThreshold(threshold + 5)} hitSlop={8}><Ionicons name="add-circle" size={28} color={colors.primary} /></Pressable>
          </Row>
        </Row>
      </Card>

      <SectionTitle>Academics</SectionTitle>
      <Card style={{ gap: 4, padding: 6 }}>
        <Link2 icon="school" label="Grades & GPA" onPress={() => router.push('/dmc')} />
        <Link2 icon="calendar" label="Weekly timetable" onPress={() => router.push('/timetable')} />
      </Card>

      <SectionTitle>Details</SectionTitle>
      <Card style={{ gap: 12 }}>
        {rows.filter(([, v]) => v).map(([k, v]) => (
          <Row key={k} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Txt color="textMuted" variant="caption">{k}</Txt>
            <Txt variant="caption" style={{ fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{v}</Txt>
          </Row>
        ))}
      </Card>

      <SectionTitle>Account</SectionTitle>
      <Card style={{ gap: 4, padding: 6 }}>
        {!demo ? <Link2 icon="key" label="Change password" onPress={() => router.push('/change-password')} /> : null}
      </Card>
      <Button title="Sign out" variant="danger" icon="log-out" onPress={confirmLogout} />
      <Txt variant="caption" color="textFaint" style={{ textAlign: 'center' }}>
        CS Attendance Plus {Constants.expoConfig?.version ?? ''} · unofficial client for the CS Attendance System
      </Txt>
    </Screen>
  );
}

function Link2({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, backgroundColor: pressed ? colors.cardAlt : 'transparent' })}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Txt style={{ flex: 1, fontWeight: '600' }}>{label}</Txt>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}
