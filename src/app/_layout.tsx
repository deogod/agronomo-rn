import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { configureAuth } from '@/api/http-client';
import { sessionAuthAdapter } from '@/features/auth/session-store';
import { useTheme, type Theme } from '@/ui';

// Module scope: runs once when the app bundle loads, before any screen.
// The http-client reads and renews the session through the session store.
configureAuth(sessionAuthAdapter);

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

// Root layout: wraps every route. TanStack Query and the auth guard
// (Stack.Protected) will be added here in later steps.
export default function RootLayout() {
  const theme = useTheme();
  return (
    <ThemeProvider value={navigationTheme(theme)}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
