import {
  getInitialNotification,
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';

import {
  getNotificationFindAllInfiniteQueryKey,
  notificationRead,
} from '@/api/generated/endpoints/notification/notification';

import { showNotice } from './in-app-notice';

// Module scope, so it survives remounts: on a cold start Android can deliver
// the same tap through getInitialNotification and the listener.
const handledTaps = new Set<string>();

/** The API's data payload: notificationId, type, redirectUrl (all strings). */
function dataString(message: RemoteMessage, key: string): string | undefined {
  const value = message.data?.[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Push events while signed in (Flutter: NotificationImpl streams consumed by
 * HomeBloc). Mounted in the (app) layout, so taps are handled only with a
 * session and with the router ready, which is what the Flutter app's buffering
 * (holdOpens/releaseOpens) achieved.
 */
export function useNotificationEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const messaging = getMessaging();
    const refreshList = () =>
      queryClient.invalidateQueries({ queryKey: getNotificationFindAllInfiniteQueryKey() });

    function onTap(message: RemoteMessage) {
      const key = message.messageId ?? dataString(message, 'notificationId');
      if (!key || handledTaps.has(key)) return;
      handledTaps.add(key);

      const id = Number(dataString(message, 'notificationId'));
      // Mark as read without waiting (Flutter: fire and forget).
      if (id) notificationRead(id).then(refreshList, () => undefined);
      // The Flutter app routed redirectUrl to screens this port does not have
      // (post, occurrence, price...). Here every tap opens the list.
      router.push('/notifications');
    }

    // App was closed and opened by the tap.
    getInitialNotification(messaging)
      .then((message) => message && onTap(message))
      .catch(() => undefined);
    // App was in the background.
    const stopOpened = onNotificationOpenedApp(messaging, onTap);
    // App is in the foreground: the system shows nothing, so we do.
    const stopForeground = onMessage(messaging, (message) => {
      refreshList();
      showNotice({
        title: message.notification?.title ?? 'Nova notificação',
        body: message.notification?.body ?? 'Toque para ver',
      });
    });

    return () => {
      stopOpened();
      stopForeground();
    };
  }, [queryClient]);
}
