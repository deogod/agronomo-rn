import { Stack } from 'expo-router';

// Screens available only with a session (guarded in the root layout).
export default function AppLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Início' }} />
    </Stack>
  );
}
