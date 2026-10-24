import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext.tsx';
import { Button, Card, Screen, Txt } from '../src/components/ui.tsx';
import { changePassword } from '../src/api/endpoints.ts';

export default function ChangePassword() {
  const { colors } = useTheme();
  const router = useRouter();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const ok = cur.length > 0 && next.length >= 8 && next === again;
  const submit = async () => {
    setBusy(true); setError(null);
    try { await changePassword(cur, next); setDone(true); setTimeout(() => router.back(), 1200); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not change password'); }
    finally { setBusy(false); }
  };
  const input = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, color: colors.text, fontSize: 15 } as const;
  return (
    <Screen edges={[]}>
      <TextInput value={cur} onChangeText={setCur} placeholder="Current password" placeholderTextColor={colors.textFaint} secureTextEntry autoCapitalize="none" style={input} />
      <TextInput value={next} onChangeText={setNext} placeholder="New password (min. 8 characters)" placeholderTextColor={colors.textFaint} secureTextEntry autoCapitalize="none" style={input} />
      <TextInput value={again} onChangeText={setAgain} placeholder="Repeat new password" placeholderTextColor={colors.textFaint} secureTextEntry autoCapitalize="none" style={input} />
      {again && next !== again ? <Txt color="danger" variant="caption">Passwords do not match.</Txt> : null}
      {error ? <Txt color="danger">{error}</Txt> : null}
      {done ? <Card tone="success"><Txt color="success">Password updated.</Txt></Card> : null}
      <Button title="Update password" onPress={submit} loading={busy} disabled={!ok} icon="key" />
    </Screen>
  );
}
