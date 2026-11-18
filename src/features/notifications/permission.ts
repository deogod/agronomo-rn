/**
 * Notification permission (Flutter: NotificationImpl.requestPermission).
 *
 * Android 13+ asks through React Native's own PermissionsAndroid; older Android
 * versions grant it at install. iOS uses React Native Firebase, whose
 * requestPermission is marked deprecated upstream but still works; it is kept
 * in this one file so it can be swapped later. expo-notifications is not used:
 * it ships its own Android FirebaseMessagingService, which would compete with
 * React Native Firebase's for the incoming messages.
 */
import {
  AuthorizationStatus,
  getMessaging,
  hasPermission,
  requestPermission,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

/**
 * - granted: notifications will show;
 * - undetermined: we can ask (on Android, also after a first "no");
 * - blocked: the system will not ask again; only the settings app can change it.
 */
export type PushPermission = 'granted' | 'undetermined' | 'blocked';

const ANDROID_PERMISSION = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
const needsAndroidRuntimePermission = Platform.OS === 'android' && Number(Platform.Version) >= 33;

export async function getPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'android') {
    if (!needsAndroidRuntimePermission) return 'granted';
    // check() cannot tell "never asked" from "blocked"; request() will.
    return (await PermissionsAndroid.check(ANDROID_PERMISSION)) ? 'granted' : 'undetermined';
  }
  return fromIosStatus(await hasPermission(getMessaging()));
}

export async function requestPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'android') {
    if (!needsAndroidRuntimePermission) return 'granted';
    const result = await PermissionsAndroid.request(ANDROID_PERMISSION);
    if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
    return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'undetermined';
  }
  return fromIosStatus(
    await requestPermission(getMessaging(), { alert: true, badge: true, sound: true }),
  );
}

function fromIosStatus(status: number): PushPermission {
  switch (status) {
    case AuthorizationStatus.AUTHORIZED:
    case AuthorizationStatus.PROVISIONAL:
    case AuthorizationStatus.EPHEMERAL:
      return 'granted';
    case AuthorizationStatus.DENIED:
      // iOS asks only once; after a "no" only the settings app can change it.
      return 'blocked';
    default:
      return 'undetermined';
  }
}
