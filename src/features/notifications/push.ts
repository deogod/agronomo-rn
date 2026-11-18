/**
 * FCM token and its registration in the API (Flutter: NotificationImpl.getToken
 * + RouterRemoteDataSource). The API sends pushes with the Firebase Admin SDK
 * to this token, so it must be the FCM token (on iOS, not the APNs one).
 */
import { getMessaging, getToken } from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

import { userRegisterDevice } from '@/api/generated/endpoints/user/user';

const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';

/**
 * The device's FCM token, or null when it has none: the iOS simulator gets no
 * APNs token, and an offline device may fail. Never throws.
 */
export async function getPushToken(): Promise<string | null> {
  try {
    return await getToken(getMessaging());
  } catch {
    return null;
  }
}

/** Same as getPushToken, but gives up after `ms` (used on logout, like the Flutter app). */
export function getPushTokenWithin(ms: number): Promise<string | null> {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
  return Promise.race([getPushToken(), timeout]);
}

// Registrations in flight, by "userId:token". Two calls at the same time (React
// runs effects twice in development; a token refresh can land during the first
// call) made the API insert the same row twice and fail on its unique key.
const inFlight = new Map<string, Promise<void>>();

/**
 * Tells the API which device token belongs to this user. Safe to repeat one
 * after the other (the API keeps one row per user and token); concurrent calls
 * for the same pair share one request.
 */
export async function registerPushToken(userId: number, token?: string): Promise<void> {
  const fcmToken = token ?? (await getPushToken());
  if (!fcmToken) return;

  const key = `${userId}:${fcmToken}`;
  const running = inFlight.get(key);
  if (running) return running;

  const request = userRegisterDevice(userId, { fcmToken, platform })
    .then(() => undefined)
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
