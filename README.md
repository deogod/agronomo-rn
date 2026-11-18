# Agrônomo RN

[![CI](https://github.com/deogod/agronomo-rn/actions/workflows/ci.yml/badge.svg)](https://github.com/deogod/agronomo-rn/actions/workflows/ci.yml)

Study port of the Meu Agrônomo Digital Flutter app to React Native. Built to learn React Native coming from Flutter, for iOS and Android.

## Features

- E-mail/password and Google sign-in, with protected routes
- Farms, and paginated fields with create, edit and delete
- Push notifications (FCM) and a notifications screen
- Occurrences with photos from the camera or gallery, and a full-screen viewer with pinch to zoom

## Stack

Expo SDK 58, TypeScript (`strict`), Expo Router, TanStack Query, Zustand, React Compiler, React Native Firebase, and an API client generated from OpenAPI with Orval.

Architecture decisions: [docs/architecture.md](docs/architecture.md).

## Running

The app needs a development build (Expo Go is not enough) and three things that are not in this repository:

1. **The backend API.** It is a separate project. The app calls `10.0.2.2:8081` on the Android emulator and `localhost:8081` on the iOS simulator. Set `EXPO_PUBLIC_API_URL` in `.env.local` to use another address (see `.env.example`).
2. **A Firebase project** with an Android app and an Apple app, both using the id `br.com.agronomo.rn`, and Google sign-in enabled.
3. **The Firebase config files** in `secrets/` (see [secrets/README.md](secrets/README.md)). Without them, Expo stops with a message saying which file is missing.

Requirements: Node 26, JDK 17 for Android, and Xcode for iOS.

```bash
npm install
npx expo run:android
npx expo run:ios
```

Rebuild after adding a native library or changing `app.config.ts`. To start only the bundler:

```bash
npx expo start --dev-client
```

## Release builds

Cloud builds use [EAS Build](https://docs.expo.dev/build/introduction/) and need your own Expo project and the Firebase files stored as EAS file variables (`GOOGLE_SERVICES_JSON`, `GOOGLE_SERVICES_PLIST`). The `preview` profile produces an Android APK and an iOS simulator app:

```bash
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform ios --profile preview
```

## Quality

```bash
npm run check      # typecheck + lint + tests (also runs in CI, no secrets needed)
npm run format     # prettier
npx expo-doctor    # needs the files in secrets/
```

## End-to-end tests

[Maestro](https://docs.maestro.dev) flows in `.maestro/` cover sign-in, fields and occurrences on both platforms. They need Maestro, Java 17, the app installed on a booted device, the backend running locally with `RATELIMIT_ENABLED=false`, and a test user in `test-user.local.json`:

```bash
npm run e2e:android
npm run e2e:ios
```

## Known limits

- Taking a photo and receiving a real push on iOS need a physical device, and were not tested on one.
- The occurrence form leaves out field, season and coordinates.
- `npm audit` reports `picomatch` (GHSA-fc5q-39xc-vjpf), used by build tools. No patched version has been published yet.

## How this was built

This is a learning project. I defined the architecture, rules and scope and reviewed each step, and the code was written with [Claude Code](https://claude.com/claude-code).

## License

The code is under the [MIT License](LICENSE). The Meu Agrônomo Digital name and brand are not covered by it.
