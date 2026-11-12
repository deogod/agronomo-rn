import type { ConfigContext, ExpoConfig } from 'expo/config';

// Dynamic app config (replaces app.json). Expo reads it at build and start
// time, so `process.env` here comes from the shell or from .env / .env.local.
// Values here are not secret once built: they end up inside the app binary.
// What must stay out of git (Firebase config files, keys) lives in ./secrets
// (git-ignored, see secrets/README.md) or in EAS environment variables.

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
  },
  android: {
    package: 'br.com.agronomo.rn',
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
