# Architecture

Agrônomo RN is a React Native port of a Flutter app. It targets iOS and Android and talks to a separate backend through its OpenAPI contract.

## Stack

- Expo SDK 58 with development builds and Continuous Native Generation (`android/` and `ios/` are generated and not committed)
- TypeScript in `strict` mode with `noUncheckedIndexedAccess`
- Expo Router with typed routes
- TanStack Query for server state and Zustand for global client state
- React Compiler
- React Native Firebase for Crashlytics, messaging and auth

## Project structure

```
.maestro/       end-to-end flows
api/            versioned OpenAPI spec and the script that adapts it
docs/           project documentation
secrets/        git-ignored Firebase files (see secrets/README.md)
src/
  app/          Expo Router routes, kept thin
  api/          HTTP client, errors and pagination; generated/ is created by Orval
  features/     auth, farms, fields, notifications and occurrences
  ui/           theme and base components
  config/       environment
app.config.ts   dynamic Expo config
eas.json        EAS Build profiles
```

## Main decisions

### Layers

There are no repository, use case or `Either` layers. Generated hooks call the API, errors surface as `ApiError`, and TanStack Query exposes them through `error`. Domain code exists only where there is a real rule, in pure and tested files.

### State

- Server data: `useQuery` and `useMutation`
- Global client state, such as the session: Zustand
- Local state: `useState`
- Data is never fetched in `useEffect`

### Generated API

Orval generates types, functions and hooks from `api/openapi.json` into `src/api/generated/`, which is never edited by hand. The hand-written `src/api/http-client.ts` handles the base URL, the token, the response envelope, a single shared refresh promise and error messages.

### Navigation

Route params are strings, so screens receive an `id` and load the entity. A screen does not wait for a result from another one: a mutation invalidates the query and the list redraws. Authentication uses `Stack.Protected`.

On iOS 26 and later the header is translucent, so every screen with a header uses a scroll view with `contentInsetAdjustmentBehavior="automatic"`.

### Forms

Values live in `useState`, validation is derived during render, and the logic stays in pure tested files such as `features/fields/field-form-values.ts`.

### Authentication

Google Sign-In returns a credential for Firebase Auth, and the Firebase ID token is exchanged for an API session at `POST /auth/firebase`. Cancelling is not an error. If the API rejects the token, the Google and Firebase sessions are undone.

### Push notifications

FCM tokens are registered on sign-in and on every token refresh, and simultaneous registrations of one token share a single request. `expo-notifications` is not used because it adds a second `FirebaseMessagingService` on Android. Permission is requested from a card on the home screen, never at launch.

### Occurrence photos

Photos come from `expo-image-picker`, are resized to 1920 px and converted to JPEG with `expo-image-manipulator`. They are uploaded as an `expo-file-system` `File`, because the global `fetch` in SDK 58 is `expo/fetch`, which does not accept `{ uri, name, type }` in `FormData`.

Photos require the `Authorization` header. `expo-image` receives the header, a `cacheKey` per photo and `cachePolicy="memory"`, so private photos are not stored on disk.

### Secrets

Firebase config files stay in the git-ignored `secrets/` folder locally and in secret EAS file variables for cloud builds. `EXPO_PUBLIC_*` values are bundled into the app, so they are never secret.

### Release builds

EAS Build has a `preview` profile (Android APK and iOS simulator app, with HTTP allowed on Android for a local backend) and a `production` profile (HTTPS only). The app `name` stays in ASCII because the EAS CLI derives the iOS scheme from it, and a config plugin sets the display name.

### Tests

- Unit tests live in `__tests__/` folders next to the code and run in CI with `npm run check`.
- Maestro flows in `.maestro/` select elements by the text users read. They run locally because they need the backend and a device, and `scripts/cleanup.js` removes the data they create, even when a flow fails.
