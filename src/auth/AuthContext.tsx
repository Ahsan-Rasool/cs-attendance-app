import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, NetworkError, setSessionExpiredHandler, tokenStore } from '../api/client.ts';
import * as api from '../api/endpoints.ts';
import type { User } from '../api/types.ts';

type Status = 'loading' | 'out' | 'in';
interface Ctx {
  status: Status; user: User | null; demo: boolean;
  signIn: (email: string, password: string, turnstileToken: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<User | null>(null);

  const reset = useCallback(() => { qc.clear(); setUser(null); setStatus('out'); }, [qc]);

  useEffect(() => {
    setSessionExpiredHandler(reset);
    (async () => {
      try {
        if (!(await tokenStore.getAccess())) return setStatus('out');
        setUser(await api.getMe());
        setStatus('in');
      } catch (e) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) { await tokenStore.clear(); setStatus('out'); }
        else if (e instanceof NetworkError) setStatus('out');
        else setStatus('out');
      }
    })();
    return () => setSessionExpiredHandler(null);
  }, [reset]);

  const signIn = useCallback(async (email: string, password: string, token: string) => {
    api.setDemo(false);
    await api.login(email.trim(), password, token);
    const me = await api.getMe();
    qc.clear(); setUser(me); setStatus('in');
  }, [qc]);

  const signInDemo = useCallback(async () => {
    api.setDemo(true); qc.clear(); setUser(await api.getMe()); setStatus('in');
  }, [qc]);

  const signOut = useCallback(async () => { await api.logout(); reset(); }, [reset]);

  const value = useMemo(() => ({ status, user, demo: api.isDemo(), signIn, signInDemo, signOut }), [status, user, signIn, signInDemo, signOut]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
