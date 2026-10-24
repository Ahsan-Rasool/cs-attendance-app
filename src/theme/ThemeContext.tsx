import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { DEFAULT_THRESHOLD } from '../lib/attendance.ts';

export interface Palette {
  bg: string; card: string; cardAlt: string; text: string; textMuted: string; textFaint: string;
  border: string; primary: string; onPrimary: string; primarySoft: string;
  success: string; successSoft: string; warning: string; warningSoft: string; danger: string; dangerSoft: string;
  chart: string[];
}

export const light: Palette = {
  bg: '#f3f5fa', card: '#ffffff', cardAlt: '#f6f8fc', text: '#0f1e3d', textMuted: '#55627a', textFaint: '#8591a6',
  border: '#e2e7f0', primary: '#14397d', onPrimary: '#ffffff', primarySoft: '#e6edfb',
  success: '#1b8a4c', successSoft: '#e3f5ea', warning: '#a86f00', warningSoft: '#fdf1d6', danger: '#c62828', dangerSoft: '#fde8e6',
  chart: ['#14397d', '#2f80ed', '#1b8a4c', '#a86f00', '#8e44ad', '#d35400'],
};
export const dark: Palette = {
  bg: '#0a101d', card: '#131b2d', cardAlt: '#18233a', text: '#e9eef8', textMuted: '#a5b0c5', textFaint: '#76829a',
  border: '#24304a', primary: '#8db2ff', onPrimary: '#0a101d', primarySoft: '#1b2a4a',
  success: '#4cc38a', successSoft: '#143325', warning: '#f0b84a', warningSoft: '#3a2d10', danger: '#ff8a80', dangerSoft: '#3d1a1a',
  chart: ['#8db2ff', '#5ac8fa', '#4cc38a', '#f0b84a', '#c792ea', '#ff9e64'],
};

export type ThemeMode = 'system' | 'light' | 'dark';

interface Ctx {
  colors: Palette; isDark: boolean; mode: ThemeMode; setMode: (m: ThemeMode) => void;
  threshold: number; setThreshold: (n: number) => void;
}
const ThemeCtx = createContext<Ctx | null>(null);
const MODE_KEY = 'csap.themeMode';
const THR_KEY = 'csap.threshold';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [threshold, setThr] = useState(DEFAULT_THRESHOLD);

  useEffect(() => {
    AsyncStorage.multiGet([MODE_KEY, THR_KEY]).then(([[, m], [, t]]) => {
      if (m === 'light' || m === 'dark' || m === 'system') setModeState(m);
      const n = Number(t);
      if (t && n >= 1 && n <= 100) setThr(n);
    }).catch(() => {});
  }, []);

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  const colors = isDark ? dark : light;
  useEffect(() => { SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {}); }, [colors.bg]);

  const setMode = useCallback((m: ThemeMode) => { setModeState(m); AsyncStorage.setItem(MODE_KEY, m).catch(() => {}); }, []);
  const setThreshold = useCallback((n: number) => {
    const v = Math.min(100, Math.max(1, Math.round(n)));
    setThr(v); AsyncStorage.setItem(THR_KEY, String(v)).catch(() => {});
  }, []);

  const value = useMemo(() => ({ colors, isDark, mode, setMode, threshold, setThreshold }), [colors, isDark, mode, setMode, threshold, setThreshold]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Ctx {
  const c = useContext(ThemeCtx);
  if (!c) throw new Error('useTheme outside ThemeProvider');
  return c;
}
