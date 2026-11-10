import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Root layout: wraps every route. Providers (TanStack Query, theme) and the
// auth guard (Stack.Protected) will be added here in later steps.
export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
