import React, { useState } from 'react';
import { TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.tsx';
import { Button, Card, Screen, Txt } from '../../src/components/ui.tsx';
import { forgotPassword } from '../../src/api/endpoints.ts';

export default function ForgotPassword() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true); setError(null);
    try { await forgotPassword(email.trim()); setSent(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Request failed'); }
    finally { setBusy(false); }
  };
  return (
    <Screen edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: true, title: 'Reset password', headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.primary, headerTitleStyle: { color: colors.text }, headerShadowVisible: false }} />
      <Txt color="textMuted">Enter your university email. If an account exists, we will send you a reset link.</Txt>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textFaint} autoCapitalize="none" keyboardType="email-address"
        style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, color: colors.text, fontSize: 15 }} />
      {sent ? <Card tone="success"><Txt color="success">If that email is registered, a reset link is on its way. Follow it to choose a new password.</Txt></Card> : null}
      {error ? <Txt color="danger">{error}</Txt> : null}
      <Button title="Send reset link" onPress={submit} loading={busy} disabled={!email.includes('@')} icon="mail" />
    </Screen>
  );
}
