import { existsSync } from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';

// Dynamic app config (replaces app.json). Expo reads it at build and start
// time, so `process.env` here comes from the shell or from .env / .env.local.
// Values here are not secret once built: they end up inside the app binary.
// What must stay out of git (Firebase config files, keys) lives in ./secrets
// (git-ignored, see secrets/README.md) or in EAS environment variables.

/**
 * Path of a git-ignored file: an env var wins (EAS file variables set it to
 * the uploaded file's path), otherwise the copy in ./secrets.
 * Fails early with a pointer to the README instead of a cryptic native error.
 */
function secretFile(envVar: string, fallback: string): string {
  const path = process.env[envVar] ?? fallback;
  if (!existsSync(path)) {
    throw new Error(
      `${path} not found. Put it in ./secrets (see secrets/README.md) or set ${envVar}.`,
    );
  }
  return path;
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Agrônomo RN',
  slug: 'agronomo-rn',
  version: '1.0.0',
  platforms: ['ios', 'android'],
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'agronomorn',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/expo.icon',
    bundleIdentifier: 'br.com.agronomo.rn',
    googleServicesFile: secretFile('GOOGLE_SERVICES_PLIST', './secrets/GoogleService-Info.plist'),
  },
  android: {
    package: 'br.com.agronomo.rn',
    googleServicesFile: secretFile('GOOGLE_SERVICES_JSON', './secrets/google-services.json'),
    adaptiveIcon: {
      backgroundColor: '#2E5E4E',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#2E5E4E',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-secure-store',
    // React Native Firebase: one entry per module that has native setup.
    '@react-native-firebase/app',
    '@react-native-firebase/crashlytics',
    // Firebase iOS SDK 13 is installed through Swift Package Manager, which
    // needs dynamic frameworks (static linking breaks the build).
    ['expo-build-properties', { ios: { useFrameworks: 'dynamic' } }],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
