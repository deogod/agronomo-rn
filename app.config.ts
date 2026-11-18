import { existsSync, readFileSync } from 'node:fs';
import type { ConfigContext, ExpoConfig } from 'expo/config';
import {
  AndroidConfig,
  withInfoPlist,
  withStringsXml,
  type ConfigPlugin,
} from 'expo/config-plugins';

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

/**
 * The OAuth "web" client (client_type 3) from google-services.json. Google
 * Sign-In needs it to issue the idToken that Firebase Auth accepts.
 */
function googleWebClientId(googleServicesJson: string): string {
  type OAuthClient = { client_id: string; client_type: number };
  const parsed = JSON.parse(readFileSync(googleServicesJson, 'utf8')) as {
    client: { oauth_client?: OAuthClient[] }[];
  };
  const web = parsed.client
    .flatMap((client) => client.oauth_client ?? [])
    .find((oauth) => oauth.client_type === 3);
  if (!web) {
    throw new Error(
      `${googleServicesJson} has no web OAuth client. Enable Google sign-in in the Firebase console and download it again.`,
    );
  }
  return web.client_id;
}

/**
 * The name shown under the icon. `name` below stays ASCII because the EAS CLI
 * derives the iOS scheme from it and drops accented letters, so a build of
 * "Agrônomo RN" looks for a scheme that prebuild did not generate.
 */
const withDisplayName: ConfigPlugin<string> = (config, displayName) => {
  const withIosName = withInfoPlist(config, (mod) => {
    mod.modResults.CFBundleDisplayName = displayName;
    return mod;
  });
  return withStringsXml(withIosName, (mod) => {
    mod.modResults = AndroidConfig.Strings.setStringItem(
      [AndroidConfig.Resources.buildResourceItem({ name: 'app_name', value: displayName })],
      mod.modResults,
    );
    return mod;
  });
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesJson = secretFile('GOOGLE_SERVICES_JSON', './secrets/google-services.json');
  return withDisplayName(
    {
      ...config,
      owner: 'deogod',
      name: 'Agronomo RN',
      slug: 'agronomo-rn',
      version: '1.0.0',
      platforms: ['ios', 'android'],
      orientation: 'portrait',
      icon: './assets/images/icon.png',
      scheme: 'agronomorn',
      userInterfaceStyle: 'automatic',
      ios: {
        icon: './assets/agronomo.icon',
        bundleIdentifier: 'br.com.agronomo.rn',
        googleServicesFile: secretFile(
          'GOOGLE_SERVICES_PLIST',
          './secrets/GoogleService-Info.plist',
        ),
        // Push: APNs entitlement (FCM delivers to iOS through APNs) and the
        // background mode for data messages. Real pushes need a physical device.
        entitlements: { 'aps-environment': 'development' },
        infoPlist: { UIBackgroundModes: ['remote-notification'] },
      },
      android: {
        package: 'br.com.agronomo.rn',
        googleServicesFile: googleServicesJson,
        // Android 13+ asks for this at runtime (see features/notifications/permission.ts).
        permissions: ['android.permission.POST_NOTIFICATIONS'],
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
            imageWidth: 200,
          },
        ],
        'expo-secure-store',
        // React Native Firebase: one entry per module that has native setup.
        '@react-native-firebase/app',
        '@react-native-firebase/crashlytics',
        '@react-native-firebase/auth',
        '@react-native-firebase/messaging',
        [
          'expo-image-picker',
          {
            cameraPermission:
              'O Agrônomo RN usa a câmera para fotografar as ocorrências da fazenda.',
            photosPermission: 'O Agrônomo RN usa suas fotos para anexar às ocorrências da fazenda.',
            // Photos only: keeps the microphone permission out of the Android app.
            microphonePermission: false,
          },
        ],
        // Same dependency manager as Firebase (SPM); keeps the Firebase-based setup.
        ['@react-native-google-signin/google-signin', { iosDependencyManager: 'spm' }],
        [
          'expo-build-properties',
          {
            // Firebase iOS SDK 13 is installed through Swift Package Manager, which
            // needs dynamic frameworks (static linking breaks the build).
            ios: { useFrameworks: 'dynamic' },
            // Firebase Android libraries (e.g. firebase-auth 25) are compiled with
            // Kotlin 2.4; the RN default (2.2) cannot read their metadata.
            android: {
              kotlinVersion: '2.4.0',
              // Only the preview profile (eas.json): it talks to the local API over
              // HTTP. Store builds keep Android's default, HTTPS only.
              ...(process.env.ANDROID_ALLOW_CLEARTEXT === 'true' && { usesCleartextTraffic: true }),
            },
          },
        ],
      ],
      experiments: {
        typedRoutes: true,
        reactCompiler: true,
      },
      // Read in the app through expo-constants (see src/config/env.ts).
      extra: {
        ...config.extra,
        eas: { projectId: '199ee842-ae81-438f-865a-c55bab3d86ad' },
        googleWebClientId: googleWebClientId(googleServicesJson),
      },
    },
    'Agrônomo RN',
  );
};
