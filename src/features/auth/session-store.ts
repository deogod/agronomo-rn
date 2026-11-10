/**
 * Session (access + refresh token and the user from the JWT).
 * Flutter: SessionStorageImpl + the auth use cases (save/get/isLoggedIn/signOut).
 *
 * - State lives in a Zustand store: screens read it with hooks and re-render
 *   when it changes; non-React code (the http-client) reads getState().
 * - Tokens persist in expo-secure-store (Keychain on iOS, Keystore on Android).
 * - Actions are plain exported functions, not part of the store state.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { authenticationLogout } from '@/api/generated/endpoints/authentication/authentication';
import type { AuthAdapter, SessionTokens } from '@/api/http-client';

import { sessionFromTokens, type Session } from './jwt';

export type SessionStatus = 'loading' | 'signedIn' | 'signedOut';

type SessionState = {
  /** 'loading' until the stored session has been read at startup. */
  status: SessionStatus;
  session: Session | null;
};

export const useSessionStore = create<SessionState>()(() => ({
  status: 'loading',
  session: null,
}));

// --- hooks -------------------------------------------------------------------

export const useSessionStatus = () => useSessionStore((state) => state.status);
export const useSessionUser = () => useSessionStore((state) => state.session?.user ?? null);

// --- persistence ------------------------------------------------------------

const ACCESS_TOKEN_KEY = 'session.accessToken';
const REFRESH_TOKEN_KEY = 'session.refreshToken';
/**
 * The iOS Keychain survives uninstalling the app; AsyncStorage does not.
 * No marker means a fresh install: whatever is in the Keychain belongs to a
 * previous one and is discarded (same rule as the Flutter SessionStorageImpl).
 */
const INSTALL_MARKER_KEY = 'session.installMarker';

const secureOptions: SecureStore.SecureStoreOptions = {
  // Readable after the first unlock (background refresh works), never
  // restored onto another device from a backup.
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

async function writeTokens(tokens: SessionTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken, secureOptions),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken, secureOptions),
  ]);
}

async function deleteTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY, secureOptions),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY, secureOptions),
  ]);
}

async function readStoredSession(): Promise<Session | null> {
  try {
    if (!(await AsyncStorage.getItem(INSTALL_MARKER_KEY))) {
      await deleteTokens();
      await AsyncStorage.setItem(INSTALL_MARKER_KEY, '1');
      return null;
    }
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY, secureOptions),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY, secureOptions),
    ]);
    if (!accessToken || !refreshToken) return null;
    return sessionFromTokens({ accessToken, refreshToken });
  } catch (error) {
    // Unreadable storage or a malformed token: start signed out.
    console.warn('Stored session discarded:', error);
    await deleteTokens().catch(() => undefined);
    return null;
  }
}

// --- actions ----------------------------------------------------------------

let hydration: Promise<void> | null = null;

/** Reads the stored session once (app start). Later calls reuse the same promise. */
export function hydrateSession(): Promise<void> {
  hydration ??= readStoredSession().then((session) => {
    useSessionStore.setState({ status: session ? 'signedIn' : 'signedOut', session });
  });
  return hydration;
}

/** After /auth/login (or /auth/firebase): persists the tokens and signs in. */
export async function signIn(tokens: SessionTokens): Promise<void> {
  const session = sessionFromTokens(tokens);
  await writeTokens(tokens);
  useSessionStore.setState({ status: 'signedIn', session });
}

/** Tokens renewed by /auth/refresh: same user, new tokens. */
async function saveTokens(tokens: SessionTokens): Promise<void> {
  const session = sessionFromTokens(tokens);
  await writeTokens(tokens);
  useSessionStore.setState({ session });
}

async function clearSession(): Promise<void> {
  await deleteTokens();
  useSessionStore.setState({ status: 'signedOut', session: null });
}

/**
 * Logout: best effort on the server (invalidates the refresh token), then
 * always clears the local session, even offline.
 */
export async function signOut(): Promise<void> {
  const refreshToken = useSessionStore.getState().session?.refreshToken;
  if (refreshToken) {
    await authenticationLogout({ refreshToken }).catch(() => undefined);
  }
  await clearSession();
}

/** Plugged into the http-client with configureAuth() at app start. */
export const sessionAuthAdapter: AuthAdapter = {
  getSession: async () => {
    await hydrateSession();
    return useSessionStore.getState().session;
  },
  saveTokens,
  clearSession,
};
