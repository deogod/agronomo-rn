# secrets/

Git-ignored folder for files that must not be in the public repo. Only this
README is committed.

| File | Used by | Where it comes from |
|---|---|---|
| `google-services.json` | Android build (Firebase) | Firebase console › project `agronomo-rn` › Android app |
| `GoogleService-Info.plist` | iOS build (Firebase) | Firebase console › project `agronomo-rn` › Apple app |
| `firebase-admin.json` | local API only (`FIREBASE_CREDENTIALS_FILE`) | Firebase console › Service accounts › Generate key |

`app.config.ts` reads these paths, unless an environment variable points
elsewhere (EAS builds use file-type environment variables instead).
The service account key is a real secret: never commit it, never put it in the
app. The other two end up inside the app binary anyway; they are kept out of
git only because this repo is public.
