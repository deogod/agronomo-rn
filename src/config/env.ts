import { Platform } from 'react-native';

// EXPO_PUBLIC_* variables are inlined at bundle time (Flutter: --dart-define).
// Without one, use the local agronomo-api: the Android emulator reaches the
// host machine at 10.0.2.2, the iOS simulator at localhost.
const localApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8081' : 'http://localhost:8081';

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? localApiUrl,
} as const;
