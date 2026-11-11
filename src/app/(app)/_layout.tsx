import { Stack } from 'expo-router';

// Screens available only with a session (guarded in the root layout).
// Each screen sets its own title with <Stack.Screen options /> inside it.
export default function AppLayout() {
  return <Stack />;
}
