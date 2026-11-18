import { Stack } from 'expo-router';

import { InAppNotice } from '@/features/notifications/in-app-notice';
import { useNotificationEvents } from '@/features/notifications/use-notification-events';
import { usePushRegistration } from '@/features/notifications/use-push-registration';

// Screens available only with a session (guarded in the root layout).
// Each screen sets its own title with <Stack.Screen options /> inside it.
// Push setup lives here so it runs only while signed in.
export default function AppLayout() {
  usePushRegistration();
  useNotificationEvents();

  return (
    <>
      <Stack />
      {/* Drawn after the Stack, so it stays on top of every screen. */}
      <InAppNotice />
    </>
  );
}
