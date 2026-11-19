import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { configureAuth } from '@/api/http-client';
import { clearOfflineCache, offlinePersistOptions } from '@/api/offline-cache';
import { connectQueryClientToDevice, queryClient } from '@/api/query-client';
import {
  hydrateSession,
  sessionAuthAdapter,
  useSessionStatus,
  useSessionStore,
  useSessionUser,
} from '@/features/auth/session-store';
import { registerOccurrenceQueue } from '@/features/occurrences/occurrence-queue';
import { useTheme, type Theme } from '@/ui';

// --- app start (module scope: runs once, before the first render) -----------

// Keep the native splash until we know whether there is a session.
void SplashScreen.preventAutoHideAsync();
// The http-client reads and renews the session through the session store.
configureAuth(sessionAuthAdapter);
connectQueryClientToDevice();
registerOccurrenceQueue(queryClient);
// Start reading the stored session right away (Flutter: RouterBloc on '/').
void hydrateSession();
// Signing out (by the user or by a rejected refresh) drops every cached
// response, so the next user never sees the previous user's data.
useSessionStore.subscribe((state, previous) => {
  if (previous.status === 'signedIn' && state.status === 'signedOut') {
    queryClient.clear();
    void clearOfflineCache();
  }
});

// --- layout -------------------------------------------------------------------

// Navigator theme (headers, screen background during transitions) built from
// our tokens, so native chrome and our screens use the same colors.
function navigationTheme(theme: Theme) {
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.background,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
    },
  };
}

export default function RootLayout() {
  const theme = useTheme();
  const status = useSessionStatus();
  const userId = useSessionUser()?.userId;

  // The saved cache belongs to a user, so wait to know who it is (splash is up).
  if (status === 'loading') return null;

  return (
    // The key restores the cache again when the user changes.
    <PersistQueryClientProvider
      key={userId ?? 'signed-out'}
      client={queryClient}
      persistOptions={offlinePersistOptions(userId)}
      onSuccess={() => queryClient.resumePausedMutations()}
    >
      <ThemeProvider value={navigationTheme(theme)}>
        <SplashScreenController />
        <RootNavigator />
        <StatusBar style="auto" />
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

/** Hides the splash once the stored session has been read. */
function SplashScreenController() {
  const status = useSessionStatus();
  // A legitimate effect: syncing React state with something outside React
  // (the native splash), not fetching data.
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hide();
  }, [status]);
  return null;
}

/**
 * Declarative auth: each group is reachable only while its guard is true.
 * When the session changes, the router drops the screens that became
 * unreachable and lands on one that is allowed (Flutter: RouterBloc +
 * offAll). While loading, the login guard is on, hidden by the splash.
 */
function RootNavigator() {
  const signedIn = useSessionStatus() === 'signedIn';
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}
