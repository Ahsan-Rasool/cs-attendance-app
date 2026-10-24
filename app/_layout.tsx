import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext.tsx';
import { AuthProvider, useAuth } from '../src/auth/AuthContext.tsx';
import { CustomClassesProvider } from '../src/hooks/useCustomClasses.tsx';
import { RemindersProvider } from '../src/hooks/useReminders.tsx';
import { ApiError } from '../src/api/client.ts';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2,
      refetchOnWindowFocus: false,
    },
  },
});

function Root() {
  const { status } = useAuth();
  const { colors, isDark } = useTheme();
  useEffect(() => { if (status !== 'loading') SplashScreen.hideAsync().catch(() => {}); }, [status]);
  if (status === 'loading') return null;
  const header = {
    headerShown: true, headerShadowVisible: false, headerTintColor: colors.primary,
    headerStyle: { backgroundColor: colors.bg }, headerTitleStyle: { color: colors.text, fontWeight: '700' as const },
    headerBackTitle: 'Back',
  };
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={status === 'in'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="course/[sectionId]" options={{ ...header, title: 'Course' }} />
          <Stack.Screen name="notice/[id]" options={{ ...header, title: 'Notice' }} />
          <Stack.Screen name="timetable" options={{ ...header, title: 'Timetable' }} />
          <Stack.Screen name="dmc" options={{ ...header, title: 'Grades & GPA' }} />
          <Stack.Screen name="change-password" options={{ ...header, title: 'Change password' }} />
        </Stack.Protected>
        <Stack.Protected guard={status === 'out'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <CustomClassesProvider><RemindersProvider><Root /></RemindersProvider></CustomClassesProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
