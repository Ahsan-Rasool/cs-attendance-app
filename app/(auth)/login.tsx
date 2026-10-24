import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext.tsx';
import { useAuth } from '../../src/auth/AuthContext.tsx';
import { Button, Txt } from '../../src/components/ui.tsx';
import { TurnstileWidget } from '../../src/components/TurnstileWidget.tsx';

export default function Login() {
  const { colors, isDark } = useTheme();
  const { signIn, signInDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!token || !email || !password) return;
    setBusy(true); setError(null);
    try {
      await signIn(email, password, token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
      setToken(null); setCaptchaKey((k) => k + 1); // Turnstile tokens are single-use
    } finally { setBusy(false); }
  };

  const input = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, color: colors.text, fontSize: 15 } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 24, gap: 14, flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 32, padding: 6, overflow: 'hidden' }}>
              <Image source={require('../../assets/images/logo.png')} style={{ width: 112, height: 112 }} resizeMode="contain" />
            </View>
            <Txt variant="title">CS Attendance Plus</Txt>
            <Txt color="textMuted" variant="caption">Sign in with your university account</Txt>
          </View>
          <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.textFaint} autoCapitalize="none" autoComplete="email" keyboardType="email-address" style={input} />
          <View>
            <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.textFaint} secureTextEntry={!show} autoCapitalize="none" style={[input, { paddingRight: 46 }]} />
            <Pressable accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((s) => !s)} style={{ position: 'absolute', right: 12, top: 12 }}>
              <Ionicons name={show ? 'eye-off' : 'eye'} size={22} color={colors.textFaint} />
            </Pressable>
          </View>
          <TurnstileWidget key={captchaKey} theme={isDark ? 'dark' : 'light'} onToken={(t) => { setToken(t); if (t) setCaptchaFailed(false); }} onError={() => setCaptchaFailed(true)} />
          {captchaFailed ? <Txt color="danger" variant="caption">Security check failed to load. Check your connection and try again.</Txt> : null}
          {error ? <Txt color="danger" variant="body">{error}</Txt> : null}
          <Button title="Sign in" onPress={submit} loading={busy} disabled={!token || !email || !password} icon="log-in" />
          <Link href="/forgot-password" asChild><Pressable style={{ alignItems: 'center', padding: 6 }}><Txt color="primary" style={{ fontWeight: '600' }}>Forgot password?</Txt></Pressable></Link>
          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 6 }} />
          <Button title="Explore with demo data" variant="ghost" icon="sparkles" onPress={signInDemo} />
          <Txt color="textFaint" variant="caption" style={{ textAlign: 'center' }}>Demo mode uses made-up data and never contacts the server.</Txt>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
