import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthContext.tsx';
import { normalizeTime, parseStored, type CustomClass } from '../lib/customTimetable.ts';

interface Ctx { classes: CustomClass[]; add: (c: Omit<CustomClass, 'id'>) => void; remove: (id: string) => void }
const C = createContext<Ctx>({ classes: [], add: () => {}, remove: () => {} });

// Stored per user id so a shared phone doesn't mix up timetables.
export function CustomClassesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const key = `csap.customClasses:${user?.id ?? 'anon'}`;
  const [classes, setClasses] = useState<CustomClass[]>([]);
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(key).then((r) => { if (live) setClasses(parseStored(r)); }).catch(() => {});
    return () => { live = false; };
  }, [key]);
  const save = useCallback((next: CustomClass[]) => { setClasses(next); AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {}); }, [key]);
  const add = useCallback((c: Omit<CustomClass, 'id'>) => {
    save([...classes, { ...c, startTime: normalizeTime(c.startTime)!, endTime: normalizeTime(c.endTime)!, title: c.title.trim(), id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}` }]);
  }, [classes, save]);
  const remove = useCallback((id: string) => save(classes.filter((c) => c.id !== id)), [classes, save]);
  const value = useMemo(() => ({ classes, add, remove }), [classes, add, remove]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useCustomClasses = () => useContext(C);
