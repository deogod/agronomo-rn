import { getMessaging, onTokenRefresh } from '@react-native-firebase/messaging';
import { useEffect } from 'react';

import { useSessionUser } from '@/features/auth/session-store';

import { registerPushToken } from './push';

/**
 * Keeps the API's copy of this device's push token current while signed in
 * (Flutter: RouterBloc._handleSession, on every start with a session).
 *
 * useEffect is the right tool here: it subscribes to something outside React
 * (the token refresh event) and cleans up. It is not fetching data to render.
 */
export function usePushRegistration() {
  const userId = useSessionUser()?.userId;

  useEffect(() => {
    if (userId == null) return;
    // Fire and forget: a failure is retried on the next start.
    registerPushToken(userId).catch(() => undefined);
    // FCM may rotate the token; the Flutter app missed this case.
    return onTokenRefresh(getMessaging(), (token) => {
      registerPushToken(userId, token).catch(() => undefined);
    });
  }, [userId]);
}
