import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthContext.tsx';
import { isDemo } from '../api/endpoints.ts';
import { useTimetable } from './queries.ts';
import { useCustomClasses } from './useCustomClasses.tsx';
import { mergeTimetable } from '../lib/customTimetable.ts';
import { cancelReminders, requestReminderPermission, syncReminders } from '../lib/reminders.ts';
import { DEFAULT_LEAD, LEAD_OPTIONS } from '../lib/remindersPlan.ts';

interface Ctx {
  enabled: boolean; lead: number; scheduled: number | null; denied: boolean;
  setEnabled: (v: boolean) => Promise<void>; setLead: (n: number) => void;
}
const C = createContext<Ctx>({ enabled: false, lead: DEFAULT_LEAD, scheduled: null, denied: false, setEnabled: async () => {}, setLead: () => {} });
const KEY = 'csap.reminders';

export function RemindersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const tt = useTimetable();
  const { classes } = useCustomClasses();
  const [enabled, setOn] = useState(false);
  const [lead, setLeadState] = useState<number>(DEFAULT_LEAD);
  const [scheduled, setScheduled] = useState<number | null>(null);
  const [denied, setDenied] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((r) => {
      try {
        const v = r ? JSON.parse(r) : null;
        if (v && typeof v.enabled === 'boolean') setOn(v.enabled);
        if (v && (LEAD_OPTIONS as readonly number[]).includes(v.lead)) setLeadState(v.lead);
      } catch { /* ignore corrupt value */ }
      loaded.current = true;
    }).catch(() => { loaded.current = true; });
  }, []);

  const persist = (e: boolean, l: number) => AsyncStorage.setItem(KEY, JSON.stringify({ enabled: e, lead: l })).catch(() => {});

  const setEnabled = useCallback(async (v: boolean) => {
    if (v) {
      const p = await requestReminderPermission().catch(() => 'denied' as const);
      setDenied(p === 'denied');
      if (p === 'denied') return;
    } else { setDenied(false); }
    setOn(v); persist(v, lead);
  }, [lead]);
  const setLead = useCallback((n: number) => { setLeadState(n); persist(enabled, n); }, [enabled]);

  // Keep scheduled reminders in step with the timetable (server + own classes).
  useEffect(() => {
    if (!loaded.current && !enabled) return;
    if (!user || !enabled || isDemo()) {
      cancelReminders().then(() => setScheduled(null)).catch(() => {});
      return;
    }
    if (!tt.data) return; // not loaded yet: don't wipe existing reminders
    syncReminders(mergeTimetable(tt.data, classes), lead).then(setScheduled).catch(() => setScheduled(null));
  }, [user, enabled, lead, tt.data, classes]);

  const value = useMemo(() => ({ enabled, lead, scheduled, denied, setEnabled, setLead }), [enabled, lead, scheduled, denied, setEnabled, setLead]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useReminders = () => useContext(C);
