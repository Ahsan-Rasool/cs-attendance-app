import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same backend and wire format as the original app (api-lms.iotpro.uk, /v1).
export const API_ORIGIN = 'https://api-lms.iotpro.uk';
export const API_BASE = `${API_ORIGIN}/v1`;
export const TURNSTILE_SITE_KEY = '0x4AAAAAAEhEMJOtdRlES950';
export const TURNSTILE_BASE_URL = 'https://iotpro.uk';

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export class NetworkError extends Error {}
class RefreshRejectedError extends Error {}

const ACCESS_KEY = 'csap.accessToken';
const REFRESH_KEY = 'csap.refreshToken';

export const tokenStore = {
  async getAccess() { return SecureStore.getItemAsync(ACCESS_KEY); },
  async getRefresh() { return SecureStore.getItemAsync(REFRESH_KEY); },
  async save(access: string, refresh?: string | null) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    if (refresh) await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(fn: (() => void) | null) { onSessionExpired = fn; }

interface Opts {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function send(path: string, opts: Opts, token: string | null): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-client-platform': 'android',
  };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(`${API_BASE}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch {
    throw new NetworkError('Network request failed');
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  let msg = `Request failed (${res.status})`;
  let details: unknown;
  try {
    const j = await res.json();
    details = j;
    const m = j?.message;
    if (Array.isArray(m)) msg = m[0]?.message ?? m[0] ?? 'Validation failed';
    else if (typeof m === 'string') msg = m;
  } catch { /* non-JSON body */ }
  return new ApiError(msg, res.status, details);
}

let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const rt = await tokenStore.getRefresh();
        if (!rt) throw new RefreshRejectedError('No refresh token stored');
        const res = await send('/auth/refresh', { method: 'POST', body: { refreshToken: rt } }, null);
        if (res.status === 401) throw new RefreshRejectedError('Refresh token rejected');
        if (!res.ok) throw new Error(`Unexpected refresh response: ${res.status}`);
        const j = await res.json();
        await tokenStore.save(j.accessToken, j.refreshToken);
        return j.accessToken as string;
      } finally {
        queueMicrotask(() => { refreshing = null; });
      }
    })();
  }
  return refreshing;
}

export async function request<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  let res: Response;
  try {
    let token = opts.auth ? await tokenStore.getAccess() : null;
    res = await send(path, opts, token);
    if (res.status === 401 && opts.auth) {
      token = await refreshAccessToken();
      res = await send(path, opts, token);
    }
  } catch (e) {
    if (e instanceof RefreshRejectedError) {
      await tokenStore.clear();
      onSessionExpired?.();
      throw new ApiError('Session expired. Please sign in again.', 401);
    }
    throw e;
  }
  if (!res.ok) throw await toApiError(res);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

/** GET with an on-device fallback so the last good data still shows offline. */
export async function cachedGet<T>(path: string): Promise<T> {
  const key = `csap.cache:${path}`;
  try {
    const data = await request<T>(path, { auth: true });
    AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
    return data;
  } catch (e) {
    if (e instanceof NetworkError) {
      const raw = await AsyncStorage.getItem(key).catch(() => null);
      if (raw) return JSON.parse(raw) as T;
    }
    throw e;
  }
}

export const LOGIN_ERRORS: Record<string, string> = {
  user_not_found: 'Account not found',
  invalid_password: 'Wrong password',
  account_deactivated: 'Account deactivated',
  captcha_failed: 'Captcha failed',
};
